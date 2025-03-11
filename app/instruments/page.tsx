"use client";

import { createClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button"; // Pastikan Anda punya komponen Button

type Instrument = {
  id: number;
  name: string;
};

export default function Page() {
  const [instruments, setInstruments] = useState<Instrument[]>([]); // 👈 Tipe sudah ditentukan
  const supabase = createClient();

  useEffect(() => {
    const getData = async () => {
      const { data } = await supabase.from("instruments").select();
      setInstruments(data || []);
    };
    getData();
  }, []);

  async function addInstrument() {
    const newInstrument = { name: "tes" };

    const { error } = await supabase.from("instruments").insert([newInstrument]);

    if (error) {
      console.error("Error adding instrument:", error);
      return;
    }

    // Perbarui state agar UI langsung berubah tanpa reload
    setInstruments((prevInstruments) => [
      ...prevInstruments,
      { id: prevInstruments.length + 1, ...newInstrument },
    ]);
  }

  return (
    <div>
      <Button onClick={addInstrument}>Add Instrument</Button>
      <Table>
        <TableCaption>A list of your recent invoices.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead className="text-right">Id</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {instruments.map((instrument) => (
            <TableRow key={instrument.id}>
              <TableCell>{instrument.name}</TableCell>
              <TableCell className="text-right">{instrument.id}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// "use client";

// import { supabase } from "@/utils/supabase/client";

// export default function Instruments() {
//   const [instruments, setInstruments] = useState<Instrument[]>([]); // 👈 Tipe sudah ditentukan

//   useEffect(() => {
//     async function fetchData() {
//       const { data, error } = await supabase.from("instruments").select();
//       if (error) {
//         console.error("Error fetching instruments:", error);
//         return;
//       }
//       setInstruments(data || []); // 👈 Pastikan data tidak undefined
//     }

//     fetchData();
//   }, []);

//   async function addInstrument() {
//     const newInstrument = { name: "tes" };

//     const { error } = await supabase
//       .from("instruments")
//       .insert([newInstrument]);

//     if (error) {
//       console.error("Error adding instrument:", error);
//       return;
//     }

//     // Perbarui state agar UI langsung berubah tanpa reload
//     setInstruments((prevInstruments) => [
//       ...prevInstruments,
//       { id: prevInstruments.length + 1, ...newInstrument },
//     ]);
//   }
//   return (
//     <div>
//       <Button onClick={addInstrument}>Add Instrument</Button>
//       <Table>
//         <TableCaption>A list of your recent invoices.</TableCaption>
//         <TableHeader>
//           <TableRow>
//             <TableHead className="w-[100px]">Name</TableHead>
//             <TableHead className="text-right">Id</TableHead>
//           </TableRow>
//         </TableHeader>
//         <TableBody>
//           {instruments.map((instrument) => (
//             <TableRow key={instrument.id}>
//               <TableCell>{instrument.name}</TableCell>
//               <TableCell className="text-right">{instrument.id}</TableCell>
//             </TableRow>
//           ))}
//         </TableBody>
//       </Table>
//     </div>
//   );
// }
