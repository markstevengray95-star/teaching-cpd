import React from 'react';
import {createRoot} from 'react-dom/client';
import {KEY,setStorageScope} from './timetableCore.js';
import {publishTimetable} from './portal.js';
import './styles.css';import './phase5.css';import './phase6.css';import './phase7.css';import './phase8.css';import './phase9.css';import './phase10.css';import './operations.css';
const channel='teaching-cpd:time-maker';let mounted=false,counter=0;
const pending=new Map();
function send(message){window.parent.postMessage({channel,...message},location.origin);}
function save(data){return new Promise((resolve,reject)=>{const id=++counter;const timer=setTimeout(()=>{pending.delete(id);reject(new Error('School save timed out. Reload before publishing.'));},30000);pending.set(id,{resolve,reject,timer});send({type:'save',id,data});});}
window.addEventListener('message',async event=>{
 if(event.origin!==location.origin||event.source!==window.parent||event.data?.channel!==channel)return;
 const message=event.data;
 if(message.type==='ack'){const item=pending.get(message.id);if(item){clearTimeout(item.timer);pending.delete(message.id);message.error?item.reject(new Error(message.error)):item.resolve();}return;}
 if(message.type==='init'&&!mounted){mounted=true;setStorageScope(message.scope);localStorage.setItem(KEY,JSON.stringify(message.data));const {default:App}=await import('./OperationsApp.jsx');window.addEventListener('time-maker-school-saved',event=>save(event.detail).catch(error=>send({type:'error',error:error.message})));createRoot(document.getElementById('root')).render(<App embedded onSync={save}/>);}
 if(message.type==='prepare-publication'){try{const data=JSON.parse(localStorage.getItem(KEY)||'{}');send({type:'publication',id:message.id,data:publishTimetable(data)});}catch(error){send({type:'publication',id:message.id,error:error.message});}}
});
if(window.parent!==window)send({type:'ready'});else document.getElementById('root').textContent='Open the Timetable section in Teaching CPD to use the school builder.';
