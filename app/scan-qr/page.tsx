'use client'
import { assets } from '@/assets/public/assets'
import Image from 'next/image'
import React, { useState } from 'react'

const page = () => {

  const [isScanning, setIsScanning] = useState(false)
  const [supplyData, setSupplyData] = useState<any>(true)

  return (
    <div className='min-w-80 flex flex-col justify-between items-center'>
      <div className='text-center flex flex-col gap-2 text-slate-900'>
        <p className='font-extrabold text-4xl'>Scan QR</p>
        <p className='text-sm'>Align QR within frame</p>
      </div>


      <div className='relative inline-block w-64 aspect-square mt-40'>
        <div className="absolute top-0 left-0 rounded-md w-10 h-10 border-t-8 border-l-8 border-slate-900"></div>
        <div className="absolute top-0 right-0 rounded-md w-10 h-10 border-t-8 border-r-8 border-slate-900"></div>
        <div className="absolute bottom-0 left-0 rounded-md w-10 h-10 border-b-8 border-l-8 border-slate-900"></div>
        <div className="absolute bottom-0 right-0 rounded-md w-10 h-10 border-b-8 border-r-8 border-slate-900"></div>
        {
          supplyData && (
            <Image
              src={assets.success_check}
              className='w-24 h-24 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
              alt='Success Scan'
            />
          )
        }
      </div>

      {
        supplyData ?
          (
            <div className='mt-20 w-72 flex flex-col gap-2 bg-white text-black border border-gray-800 rounded-2xl px-6 py-4'>
              <div className='flex gap-3 mb-1 items-center'>
                <Image src={assets.success_check} className='w-8 h-8' alt="Success Scan Check" />
                <p className='text-xl font-bold'>Ayam</p>
              </div>
              <div className='flex gap-3 text-sm'>
                <p className='font-light'>Quantity</p>
                <p className='font-bold'>10 Kg</p>
              </div>
              <div className='flex gap-3 text-sm'>
                <p className='font-light'>Scanned</p>
                <p className='font-bold'>May 2 2025, 10:32 AM</p>
              </div>
            </div>
          )
          :
          (
            <button
              className={`mt-40 bg-slate-900 px-5 py-3 rounded-md flex items-center gap-2 font-light ${isScanning ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
            >
              <Image src={assets.scan} className='w-4 h-4' alt="Scan Button" />Scan QR Code
            </button>
          )
      }
    </div >
  )
}

export default page
