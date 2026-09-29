import { NextRequest } from "next/server";

export const runtime="nodejs";

type Message={role:"user"|"assistant";content:string};
type Body={goal?:string;context?:Record<string,unknown>;messages?:Message[]};

function fallbackReply(body:Body){
  const goal=(body.goal||"").trim();
  const context=body.context||{};
  const completed=Number(context.completedCount||0);
  const activeTargets=Number(context.activeTargets||0);
  const openActions=Number(context.openActions||0);
  const question=body.messages?.filter(m=>m.role==="user").at(-1)?.content||"";
  return {
    mode:"smart-fallback",
    text:`Focus on one small change linked to ${goal||"your current development priority"}. You currently have ${activeTargets} active target${activeTargets===1?"":"s"}, ${openActions} open implementation action${openActions===1?"":"s"}, and ${completed} completed course${completed===1?"":"s"}. ${question?`For “${question.slice(0,140)}”, start by defining the observable outcome you want, choose one action you can test this week, and decide what evidence would make you keep, adapt or stop it.`:"Choose one action you can test this week and one piece of evidence you will review afterwards."}`
  };
}

function extractText(payload:any){
  if(typeof payload?.output_text==="string"&&payload.output_text.trim())return payload.output_text.trim();
  const chunks:Array<string>=[];
  for(const item of payload?.output||[]){for(const part of item?.content||[]){if(typeof part?.text==="string")chunks.push(part.text);}}
  return chunks.join("\n").trim();
}

export async function POST(request:NextRequest){
  let body:Body; try{body=await request.json();}catch{return Response.json({error:"Invalid request."},{status:400});}
  const key=process.env.OPENAI_API_KEY;
  if(!key)return Response.json(fallbackReply(body));
  const recent=(body.messages||[]).slice(-8).map(m=>`${m.role.toUpperCase()}: ${m.content}`).join("\n");
  const context=JSON.stringify(body.context||{}).slice(0,8000);
  const input=`Professional-development goal: ${body.goal||"Not specified"}\nContext: ${context}\nConversation:\n${recent}\n\nRespond as a concise school CPD coach. Ask reflective questions when useful, recommend no more than 3 next actions, connect advice to implementation evidence, and never rank individual staff. Do not invent school policies or safeguarding procedures.`;
  try{
    const response=await fetch("https://api.openai.com/v1/responses",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:process.env.OPENAI_COACH_MODEL||"gpt-5.6-luna",input,instructions:"You are a professional-development coach for school staff. Be practical, evidence-aware, concise and supportive of professional judgement.",max_output_tokens:500})});
    if(!response.ok)return Response.json(fallbackReply(body));
    const payload=await response.json(); const text=extractText(payload);
    return Response.json(text?{mode:"ai",text}:fallbackReply(body));
  }catch{return Response.json(fallbackReply(body));}
}
