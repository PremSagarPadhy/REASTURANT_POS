import React from 'react'
import { useSelector } from 'react-redux'
import { getTotalPrice } from '../../redux/slices/cartSlice'

const BillInfo = () => {
  const cartData=useSelector(state => state.cart);
  const total=useSelector(getTotalPrice);
  const taxRate=12;
  const tax=(total*taxRate)/100;
  const totalpricewithtax=total+tax;
  return (
    <>
    <div className='flex items-center justify-between px-5 mt-2'>
        <p className='text-xs text-[#ababab] font-medium mt-2'>Items: {cartData.length}</p>
        <h1 className='text-md text-[#f5f5f5] font-bold'>₹{totalpricewithtax}</h1>
    </div>
    <div className='flex items-center justify-between px-5 mt-2'>
        <p className='text-xs text-[#ababab] font-medium mt-2'>Tax(12%)</p>
        <h1 className='text-md text-[#f5f5f5] font-bold'>₹{tax}</h1>
    </div>
    <div className='flex items-center justify-between px-5 mt-2'>
        <p className='text-xs text-[#ababab] font-medium mt-2'>Total With Tax</p>
        <h1 className='text-md text-[#f5f5f5] font-bold'>₹{totalpricewithtax}</h1>
    </div>
    <div className='flex items-center gap-3 px-5 mt-4'>
        <button className='bg-[#262626] px-4 py-3 w-full rounded-lg text-[#ababab] font-semibold text-lg'>Cash</button>
        <button className='bg-[#262626] px-4 py-3 w-full rounded-lg text-[#ababab] font-semibold text-lg'>Online</button>
    </div>
    <div className='flex items-center gap-3 px-5 mt-4'>
        <button className='bg-[#025cca] px-4 py-3 w-full rounded-lg text-[#ababab] font-semibold text-lg'>Print Receipt</button>
        <button className='bg-[#f6b100] px-4 py-3 w-full rounded-lg text-[#1a1a1a] font-semibold text-lg'>Place Order</button>
    </div>
    </>
  )
}

export default BillInfo