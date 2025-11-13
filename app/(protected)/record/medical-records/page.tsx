import { Pagination } from "@/components/pagination";
import { ProfileImage } from "@/components/profile-image";
import SearchInput from "@/components/search-input";
import { Table } from "@/components/tables/table";
import { SearchParamsProps } from "@/types";
import { checkRole } from "@/utils/roles";
import { DATA_LIMIT } from "@/utils/seetings";
import { getMedicalRecords } from "@/utils/services/medical-record";
import { Diagnosis, MedicalRecords, Patient } from "@prisma/client";
import { format } from "date-fns";
import { BriefcaseBusiness } from "lucide-react";
import { ActionDialog } from "@/components/action-dialog";
const columns = [
  { header: "No", key: "no", className: "w-12" },
  { header: "Info", key: "name", className: "w-56 md:w-64" }, 
  { header: "Date & Time", key: "medical_date", className: "hidden md:table-cell w-48" },
  { header: "Doctor", key: "doctor", className: "hidden 2xl:table-cell w-72" },
  { header: "Diagnosis", key: "diagnosis", className: "hidden lg:table-cell w-24" },
  { header: "Action", key: "action", className: "w-24" },
];


interface ExtendedProps extends MedicalRecords {
  index: number;
  patient: Patient;
  appointment: {
    doctor: {
      name: string;
      specialization: string;
      img: string | null;
      colorCode: string | null;
    } | null;
  };
  diagnosis: Diagnosis[];
  _count: {
    diagnosis: number;
  };
}

const MedicalRecordsPage = async (props: SearchParamsProps) => {
  const searchParams = await props.searchParams;
  const page = (searchParams?.p || "1") as string;
  const searchQuery = (searchParams?.q || "") as string;

  const { data, totalPages, totalRecords, currentPage } =
    await getMedicalRecords({
      page,
      search: searchQuery,
    });
  const isAdmin = await checkRole("ADMIN");

  if (!data) return null;

  const renderRow = (item: ExtendedProps) => {
    const name1 = item?.patient?.first_name + " " + item?.patient?.last_name;
    const patient = item?.patient;
    const doctor = (item as any)?.appointment?.doctor;
    const name2 = doctor?.name;

    return (
    <tr
      key={item.id}
      className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-slate-50"
    >
      {/* 1. NO */}
      {/* 1. NO */}
      <td className="p-3">{item.index + 1}</td>


      {/* 2. INFO */}
      <td className="flex gap-4 p-4">
        <ProfileImage
          url={item.patient.img!}
          name={name1}
          bgColor={item.patient.colorCode!}
          textClassName="text-black"
        />
        <div>
          <h3 className="uppercase">{name1}</h3>
          <span className="text-sm capitalize">{item.patient.gender}</span>
        </div>
      </td>

      {/* 3. DATE & TIME */}
      <td className="w-60">
        {format(item.created_at, "yyyy-MM-dd HH:mm:ss")}
      </td>

      {/* 4. DOCTOR */}
    <td className="hidden 2xl:table-cell">
      <div className="flex gap-3 p-2 items-center">
        <ProfileImage
          url={item.appointment?.doctor?.img!}
          name={name2}
          bgColor={item.appointment?.doctor?.colorCode!}
          textClassName="text-black"
        />
      <div>
      <h3 className="uppercase">{name2}</h3>
      <span className="text-sm text-gray-500">{item.appointment?.doctor?.specialization}</span>
    </div>
  </div>
</td>


      {/* 5. DIAGNOSIS */}
      <td className="hidden lg:table-cell">
        {item.diagnosis.length === 0 ? (
          <span className="text-gray-400 italic">No diagnosis found</span>
        ) : (
          <span>{item._count.diagnosis}</span>
        )}
      </td>

      {/* 6. ACTION */}
      <td>
          {isAdmin && (
                      <ActionDialog
                        type="delete"
                        deleteType="medical"
                        id={item?.id.toString()}
                      />
                    )}
      </td>
    </tr>
  );
};
  return (
    <div className="bg-white rounded-xl py-6 px-3 2xl:px-6">
      <div className="flex items-center justify-between">
        <div className="hidden lg:flex items-center gap-1">
          <BriefcaseBusiness size={20} className="text-gray-500" />

          <p className="text-2xl font-semibold">{totalRecords}</p>
          <span className="text-gray-600 text-sm xl:text-base">
            total records
          </span>
        </div>
        <div className="w-full lg:w-fit flex items-center justify-between lg:justify-start gap-2">
          <SearchInput />
        </div>
      </div>

      <div className="mt-4">
        <Table columns={columns} data={data} renderRow={renderRow} />

        <Pagination
          totalPages={totalPages}
          currentPage={currentPage}
          totalRecords={totalRecords}
          limit={DATA_LIMIT}
        />
      </div>
    </div>
  );
};

export default MedicalRecordsPage;
