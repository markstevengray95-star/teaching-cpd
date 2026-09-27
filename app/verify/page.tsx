"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { courses } from "@/lib/catalogue";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { isCertificateReference, normaliseCertificateReference } from "@/lib/certificates";

type VerifiedCertificate = {
  reference: string;
  courseId: string;
  completedAt: string;
  recipientName: string;
  organisationName: string;
  issuedAt: string;
};

type VerifyResponse = {
  valid: boolean;
  certificate?: VerifiedCertificate;
  error?: string;
};

export default function VerifyCertificatePage() {
  const [reference, setReference] = useState("");
  const [result, setResult] = useState<VerifiedCertificate | null>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [message, setMessage] = useState("");

  async function verify(raw: string) {
    const ref = normaliseCertificateReference(raw);
    setReference(ref);
    setResult(null);
    setMessage("");
    if (!isCertificateReference(ref)) {
      setStatus("invalid");
      setMessage("That certificate reference is not in the expected format.");
      return;
    }

    setStatus("checking");
    const client = getSupabaseBrowserClient();
    const { data, error } = await client.functions.invoke<VerifyResponse>("verify-certificate", {
      body: { reference: ref },
    });

    if (error || !data?.valid || !data.certificate) {
      setStatus("invalid");
      setMessage(data?.error || "This certificate could not be verified. Check the reference and try again.");
      return;
    }

    setResult(data.certificate);
    setStatus("valid");
  }

  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get("ref") || "";
    if (ref) void verify(ref);
  }, []);

  const course = useMemo(() => result ? courses.find(item => item.id === result.courseId) : undefined, [result]);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void verify(reference);
  }

  return <main className="verifyPage">
    <section className="verifyHero">
      <div className="verifyBrand">TEACHING CPD HUB</div>
      <span className="eyebrow">PUBLIC CERTIFICATE CHECK</span>
      <h1>Verify a CPD certificate</h1>
      <p>Enter the certificate reference shown on a Teaching CPD Hub certificate. Verification confirms the platform-issued completion record without exposing email addresses, account IDs, reflections or other private staff data.</p>
      <form className="verifyForm" onSubmit={submit}>
        <label htmlFor="certificate-reference">Certificate reference</label>
        <div className="verifyInputRow">
          <input id="certificate-reference" value={reference} onChange={e => setReference(e.target.value.toUpperCase())} placeholder="CPD-20260927-ABC1234" autoComplete="off" spellCheck={false} />
          <button className="primary" disabled={status === "checking"}>{status === "checking" ? "Checking…" : "Verify"}</button>
        </div>
      </form>
    </section>

    {status === "valid" && result && <section className="verifyResult verified" aria-live="polite">
      <div className="verifyStatusIcon">✓</div>
      <div className="verifyStatusText"><span>VERIFIED</span><h2>Valid Teaching CPD Hub certificate</h2><p>This reference matches an active platform-issued course completion record.</p></div>
      <dl className="verifyDetails">
        <div><dt>Certificate reference</dt><dd><code>{result.reference}</code></dd></div>
        <div><dt>Recipient</dt><dd>{result.recipientName}</dd></div>
        <div><dt>Course</dt><dd>{course?.title || result.courseId}</dd></div>
        {course && <div><dt>Professional learning</dt><dd>{course.duration} minutes</dd></div>}
        <div><dt>Completed</dt><dd>{new Date(result.completedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</dd></div>
        <div><dt>Issuing school / organisation</dt><dd>{result.organisationName}</dd></div>
      </dl>
      {course?.category === "Safeguarding" && <div className="verifyBoundary"><strong>Safeguarding certificate boundary</strong><p>This verifies completion of school CPD. It does not claim an externally accredited safeguarding qualification and does not replace specialist DSL/DDSL training where that is required.</p></div>}
    </section>}

    {status === "invalid" && <section className="verifyResult invalid" aria-live="polite">
      <div className="verifyStatusIcon">!</div>
      <div className="verifyStatusText"><span>NOT VERIFIED</span><h2>Certificate not verified</h2><p>{message}</p></div>
      <p className="verifyHelp">A failed check does not by itself prove a document is fraudulent. Confirm that the reference was entered exactly as shown on the certificate or ask the certificate holder to provide a newly downloaded copy.</p>
    </section>}

    <section className="verifyPrivacy">
      <strong>Privacy by design</strong>
      <p>The public checker returns only the information needed to confirm the certificate: recipient name, course, completion date, issuing organisation and certificate reference.</p>
    </section>
  </main>;
}
