"use client";
import { useState } from "react";
export type Role = "customer"|"factory"|"designer"|"sales";
const roles=[{id:"customer",label:"Захиалагч",sub:"Print buyer"},{id:"factory",label:"Үйлдвэр",sub:"Print factory"},{id:"designer",label:"Дизайнер",sub:"Creative"},{id:"sales",label:"Борлуулагч",sub:"Sales partner"}];
export default function RoleSelector({value,onChange}:{value?:Role;onChange?:(r:Role)=>void}){
  const [sel,setSel]=useState<Role>(value??"customer");
  const pick=(r:Role)=>{setSel(r);onChange?.(r);};
  return(<><style>{`.bprs{display:flex;gap:6px;padding:5px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);border-radius:14px;width:fit-content;font-family:'DM Sans',sans-serif}.bprs-btn{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:10px 18px;border-radius:10px;border:1px solid transparent;background:transparent;cursor:pointer;transition:all .18s;outline:none}.bprs-btn:hover:not(.on){background:rgba(255,255,255,0.05)}.on{background:rgba(242,101,34,0.12);border-color:rgba(242,101,34,0.35)}.lbl{font-size:13.5px;font-weight:500;color:rgba(255,255,255,0.45);letter-spacing:-0.2px;line-height:1;transition:color .18s}.on .lbl{color:#F5F3FF;font-weight:600}.sub{font-size:10.5px;color:rgba(255,255,255,0.2);line-height:1;transition:color .18s}.on .sub{color:rgba(242,101,34,0.7)}`}</style>
  <div className="bprs">{roles.map(r=><button key={r.id} className={`bprs-btn${sel===r.id?" on":""}`} onClick={()=>pick(r.id as Role)}><span className="lbl">{r.label}</span><span className="sub">{r.sub}</span></button>)}</div></>);
}