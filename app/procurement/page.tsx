import {courses} from "@/lib/catalogue";
import {catalogueFacts} from "@/lib/schoolProcurement";
import SchoolProcurementPack from "@/app/components/SchoolProcurementPack";
export const metadata={title:"School procurement pack · Teaching CPD",description:"Product overview and draft school procurement checklist for review."};
export default function ProcurementPage(){return <SchoolProcurementPack facts={catalogueFacts(courses)}/>;}
