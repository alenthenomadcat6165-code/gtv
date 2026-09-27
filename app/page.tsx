'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

type CarSpec = { name:string; type:string; color:string; accent:string; speed:number; grip:number; boost:number };
const CARS: CarSpec[] = [
  { name:'Vandal GT', type:'STREET', color:'#d6ff3f', accent:'#11150f', speed:1, grip:.78, boost:1 },
  { name:'Nightline', type:'DRIFT', color:'#b9b8ff', accent:'#171624', speed:.9, grip:.52, boost:1.15 },
  { name:'Ridgeback', type:'OFFROAD', color:'#ff6f3d', accent:'#1f1511', speed:.82, grip:.9, boost:.9 },
];

function CarIcon({car}:{car:CarSpec}) {
  return <div className="car-icon" style={{'--car':car.color,'--accent':car.accent} as React.CSSProperties}><i className="spoiler"/><i className="cabin"/><i className="body"/><i className="wheel a"/><i className="wheel b"/></div>
}

function CityGame({car, onExit, sound}:{car:CarSpec; onExit:()=>void; sound:boolean}) {
  const mount = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(0);
  const [score, setScore] = useState(0);
  const [air, setAir] = useState(false);
  const [message, setMessage] = useState('Find a ramp');

  useEffect(() => {
    if (!mount.current) return;
    const host = mount.current;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x9fc7ce);
    scene.fog = new THREE.FogExp2(0x9fc7ce, .0052);
    const camera = new THREE.PerspectiveCamera(62, host.clientWidth/host.clientHeight, .1, 900);
    const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:'high-performance'});
    renderer.setSize(host.clientWidth, host.clientHeight); renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
    renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xe6fbff,0x30402b,2.3));
    const sun = new THREE.DirectionalLight(0xfff0cb,3.2); sun.position.set(-55,90,-25); sun.castShadow=true; sun.shadow.mapSize.set(2048,2048); sun.shadow.camera.left=-140;sun.shadow.camera.right=140;sun.shadow.camera.top=140;sun.shadow.camera.bottom=-140; scene.add(sun);
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(650,650),new THREE.MeshStandardMaterial({color:0x53614c,roughness:1})); ground.rotation.x=-Math.PI/2; ground.receiveShadow=true; scene.add(ground);

    const roadMat = new THREE.MeshStandardMaterial({color:0x202627,roughness:.82});
    for(let i=-3;i<=3;i++){ const road=new THREE.Mesh(new THREE.PlaneGeometry(18,580),roadMat);road.rotation.x=-Math.PI/2;road.position.set(i*72,.018,0);scene.add(road); const cross=road.clone();cross.rotation.z=Math.PI/2;cross.position.set(0,.02,i*72);scene.add(cross); }
    const dashMat=new THREE.MeshBasicMaterial({color:0xd7dfbc});
    for(let r=-3;r<=3;r++) for(let d=-14;d<=14;d++){ const dash=new THREE.Mesh(new THREE.PlaneGeometry(.32,7),dashMat);dash.rotation.x=-Math.PI/2;dash.position.set(r*72,.035,d*18);scene.add(dash); const dash2=dash.clone();dash2.rotation.z=Math.PI/2;dash2.position.set(d*18,.036,r*72);scene.add(dash2); }

    const blockers: {x:number;z:number,hx:number;hz:number}[]=[];
    const geoCache:Record<string,THREE.BoxGeometry>={};
    const palette=[0x263338,0x374247,0x43443d,0x314b4a,0x505047];
    const rand=(x:number,z:number)=>Math.abs(Math.sin(x*12.9898+z*78.233)*43758.5453)%1;
    for(let gx=-3;gx<3;gx++) for(let gz=-3;gz<3;gz++){
      const cx=gx*72+36, cz=gz*72+36;
      for(const [ox,oz] of [[-16,-16],[16,-16],[-16,16],[16,16]]){
        const h=15+rand(cx+ox,cz+oz)*60, w=22+rand(ox,cx)*8, dep=22+rand(oz,cz)*8;
        const key=`${Math.round(w)}-${Math.round(h)}-${Math.round(dep)}`; const geo=geoCache[key]||(geoCache[key]=new THREE.BoxGeometry(w,h,dep));
        const mat=new THREE.MeshStandardMaterial({color:palette[Math.floor(rand(cx+ox*2,cz+oz)*palette.length)],roughness:.7,metalness:.08});
        const b=new THREE.Mesh(geo,mat);b.position.set(cx+ox,h/2,cz+oz);b.castShadow=true;b.receiveShadow=true;scene.add(b);blockers.push({x:b.position.x,z:b.position.z,hx:w/2+.9,hz:dep/2+.9});
        const windows=new THREE.Mesh(new THREE.BoxGeometry(w+0.12,Math.max(2,h*.72),dep+0.12),new THREE.MeshBasicMaterial({color:0xaad2be,wireframe:true,transparent:true,opacity:.12}));windows.position.copy(b.position);scene.add(windows);
      }
      const park=new THREE.Mesh(new THREE.CylinderGeometry(9,9,.25,24),new THREE.MeshStandardMaterial({color:0x43583a}));park.position.set(cx,.13,cz);scene.add(park);
    }
    // perimeter landmarks
    for(let i=0;i<35;i++){const angle=i/35*Math.PI*2,rad=250+rand(i,7)*45,h=35+rand(i,3)*95;const b=new THREE.Mesh(new THREE.BoxGeometry(22,h,22),new THREE.MeshStandardMaterial({color:palette[i%palette.length]}));b.position.set(Math.cos(angle)*rad,h/2,Math.sin(angle)*rad);scene.add(b)}

    const rampZones:{x:number;z:number;angle:number}[]=[];
    function addRamp(x:number,z:number,angle:number){const g=new THREE.Group();const ramp=new THREE.Mesh(new THREE.BoxGeometry(9,.7,16),new THREE.MeshStandardMaterial({color:0xd6ff3f,roughness:.55}));ramp.rotation.x=-.25;ramp.castShadow=true;g.add(ramp);for(const s of [-3,0,3]){const stripe=new THREE.Mesh(new THREE.BoxGeometry(1,.72,16.1),new THREE.MeshBasicMaterial({color:0x161b18}));stripe.rotation.x=-.25;stripe.position.x=s;g.add(stripe)}g.position.set(x,2,z);g.rotation.y=angle;scene.add(g);rampZones.push({x,z,angle})}
    addRamp(0,-48,0);addRamp(72,54,Math.PI);addRamp(-72,-110,0);addRamp(144,126,Math.PI/2);addRamp(-144,90,-Math.PI/2);
    const hoops:THREE.Mesh[]=[]; for(const [x,z] of [[0,-83],[72,18],[-72,-145],[179,126]]){const hoop=new THREE.Mesh(new THREE.TorusGeometry(8,.65,12,28),new THREE.MeshBasicMaterial({color:0xd6ff3f}));hoop.position.set(x,11,z);hoop.rotation.y=Math.PI/2;scene.add(hoop);hoops.push(hoop)}

    const vehicle=new THREE.Group();scene.add(vehicle);
    const paint=new THREE.MeshStandardMaterial({color:new THREE.Color(car.color),metalness:.48,roughness:.26});
    const dark=new THREE.MeshStandardMaterial({color:new THREE.Color(car.accent),metalness:.3,roughness:.3});
    const glass=new THREE.MeshStandardMaterial({color:0x9fd2d8,metalness:.5,roughness:.1,transparent:true,opacity:.72});
    const base=new THREE.Mesh(new THREE.BoxGeometry(3.7,1,7.4),paint);base.position.y=1.05;base.castShadow=true;vehicle.add(base);
    const hood=new THREE.Mesh(new THREE.BoxGeometry(3.5,.45,2.3),paint);hood.position.set(0,1.65,-2.35);vehicle.add(hood);
    const cabin=new THREE.Mesh(new THREE.BoxGeometry(3.05,1.25,3),glass);cabin.position.set(0,2.02,.15);cabin.rotation.x=-.05;vehicle.add(cabin);
    const spoiler=new THREE.Mesh(new THREE.BoxGeometry(4,.18,.75),dark);spoiler.position.set(0,2,3.2);vehicle.add(spoiler);
    const wheelGeo=new THREE.CylinderGeometry(.72,.72,.48,18); const wheelMat=new THREE.MeshStandardMaterial({color:0x090a0a,roughness:.8}); const wheels:THREE.Mesh[]=[];
    for(const x of [-2,2])for(const z of [-2.35,2.35]){const w=new THREE.Mesh(wheelGeo,wheelMat);w.rotation.z=Math.PI/2;w.position.set(x,.72,z);w.castShadow=true;vehicle.add(w);wheels.push(w)}
    const tailMat=new THREE.MeshBasicMaterial({color:0xff3226});for(const x of [-1.15,1.15]){const l=new THREE.Mesh(new THREE.BoxGeometry(.75,.28,.08),tailMat);l.position.set(x,1.2,3.72);vehicle.add(l)}

    const keys:Record<string,boolean>={};let heading=0, velocity=0, y=0,vy=0,pitch=0,roll=0,airborne=false,last=performance.now(),points=0, boost=100, touchSteer=0, touchGas=0;
    const down=(e:KeyboardEvent)=>{keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='KeyR')reset()};const up=(e:KeyboardEvent)=>{keys[e.code]=false};addEventListener('keydown',down);addEventListener('keyup',up);
    function reset(){vehicle.position.set(0,0,12);heading=Math.PI;velocity=0;y=0;vy=0;pitch=0;roll=0;setMessage('Back on the road')}
    reset();
    const touch=(ev:Event)=>{const el=ev.currentTarget as HTMLElement;const k=el.dataset.key||'';const on=ev.type==='pointerdown';keys[k]=on;if(on)el.setPointerCapture((ev as PointerEvent).pointerId)};
    host.parentElement?.querySelectorAll<HTMLElement>('[data-key]').forEach(el=>{el.addEventListener('pointerdown',touch);el.addEventListener('pointerup',touch);el.addEventListener('pointercancel',touch)});

    function animate(now:number){const dt=Math.min((now-last)/1000,.04);last=now;const throttle=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+touchGas;const steer=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0)+touchSteer;const boosting=(keys.ShiftLeft||keys.ShiftRight)&&boost>0;
      const max=34*car.speed*(boosting?1.42:1);if(throttle>0)velocity+=22*car.speed*dt;else if(throttle<0)velocity-=28*dt;else velocity*=Math.pow(.965,dt*60);if(keys.Space)velocity*=Math.pow(.95,dt*60);velocity=THREE.MathUtils.clamp(velocity,-12,max);if(boosting&&Math.abs(velocity)>5)boost=Math.max(0,boost-30*dt);else boost=Math.min(100,boost+8*dt);
      if(Math.abs(velocity)>.4) heading+=steer*(1.8-car.grip*.45)*dt*(velocity>=0?1:-1)*Math.min(1,Math.abs(velocity)/8);
      const nx=vehicle.position.x+Math.sin(heading)*velocity*dt,nz=vehicle.position.z+Math.cos(heading)*velocity*dt;let blocked=false;for(const b of blockers){if(Math.abs(nx-b.x)<b.hx&&Math.abs(nz-b.z)<b.hz){blocked=true;break}}if(Math.abs(nx)>310||Math.abs(nz)>310)blocked=true;if(blocked){velocity*=-.22;setMessage('Ouch — keep it on the road');}else{vehicle.position.x=nx;vehicle.position.z=nz}
      if(!airborne&&Math.abs(velocity)>13){for(const r of rampZones){if(Math.hypot(vehicle.position.x-r.x,vehicle.position.z-r.z)<9){airborne=true;vy=10+Math.abs(velocity)*.22;setAir(true);setMessage('AIR TIME');break}}}
      if(airborne){vy-=22*dt;y+=vy*dt;pitch+=velocity*.012*dt;roll+=steer*1.25*dt;if(y<=0){y=0;airborne=false;vy=0;const gain=Math.round((Math.abs(pitch)+Math.abs(roll))*300+100);points+=gain;setScore(points);setAir(false);setMessage(`LANDED +${gain}`);pitch=0;roll=0}}
      vehicle.position.y=y;vehicle.rotation.set(pitch,heading,roll);wheels.forEach(w=>w.rotation.x-=velocity*dt/0.72);hoops.forEach(h=>h.rotation.z+=dt*.45);
      const desired=new THREE.Vector3(vehicle.position.x-Math.sin(heading)*13,vehicle.position.y+7,vehicle.position.z-Math.cos(heading)*13);camera.position.lerp(desired,1-Math.pow(.002,dt));camera.lookAt(vehicle.position.x,vehicle.position.y+1.6,vehicle.position.z);
      if(Math.floor(now/100)%4===0)setSpeed(Math.round(Math.abs(velocity)*3.1)); const meter=host.parentElement?.querySelector<HTMLElement>('.boost-fill');if(meter)meter.style.width=`${boost}%`;
      renderer.render(scene,camera);requestAnimationFrame(animate)}
    const raf=requestAnimationFrame(animate);const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);removeEventListener('keydown',down);removeEventListener('keyup',up);renderer.dispose();host.removeChild(renderer.domElement)};
  },[car]);

  return <div className="game-screen">
    <div className="game-canvas" ref={mount}/>
    <div className="game-top"><button className="exit" onClick={onExit}>← Garage</button><div className="game-logo">GTV</div><div className="sound-state">{sound?'SOUND ON':'MUTED'}</div></div>
    <div className="stunt-callout"><span>{air?'STUNT IN PROGRESS':message}</span><strong>{score.toLocaleString()} PTS</strong></div>
    <div className="speedo"><b>{speed}</b><span>KM/H</span><div className="boost-label">BOOST</div><div className="boost-track"><i className="boost-fill"/></div></div>
    <div className="controls-hint"><span><kbd>WASD</kbd> DRIVE</span><span><kbd>SPACE</kbd> DRIFT</span><span><kbd>SHIFT</kbd> BOOST</span><span><kbd>R</kbd> RESET</span></div>
    <div className="touch-controls"><div><button data-key="KeyA">←</button><button data-key="KeyD">→</button></div><div><button data-key="KeyS">▼</button><button data-key="KeyW">▲</button></div></div>
  </div>
}

export default function Home(){
  const [view,setView]=useState<'home'|'garage'|'game'>('home');const [selected,setSelected]=useState(0);const [settings,setSettings]=useState(false);const [sound,setSound]=useState(true);const [quality,setQuality]=useState('High');
  if(view==='game')return <CityGame car={CARS[selected]} onExit={()=>setView('garage')} sound={sound}/>;
  return <main className={view==='garage'?'garage-shell':'home-shell'}>
    <div className="sky-glow"/><nav className="topbar"><button className="brand-mark" onClick={()=>setView('home')}>GTV</button><span className="status-pill"><i/> City online</span></nav>
    {view==='home'?<>
      <section className="hero"><p className="eyebrow">No missions. No limits.</p><h1>Grand Theft<br/><em>Vehicles</em></h1><p className="lede">Pick a ride. Find a ramp. Make the city your playground.</p><div className="home-actions"><button className="primary" onClick={()=>setView('garage')}>Play now <span>↗</span></button><button className="secondary" onClick={()=>setSettings(true)}>Settings <span>⚙</span></button></div></section>
      <div className="city-silhouette" aria-hidden="true"><span/><span/><span/><span/><span/><span/><span/><span/></div><footer><span>Open world driving</span><span>Free roam</span><span>Built for the browser</span></footer>
    </>:<section className="garage"><div className="garage-heading"><button onClick={()=>setView('home')}>← Back</button><div><p className="eyebrow">Choose your weapon</p><h2>Pick a ride</h2></div><span>03 / 03</span></div><div className="car-grid">{CARS.map((c,i)=><button key={c.name} className={`car-card ${selected===i?'selected':''}`} onClick={()=>setSelected(i)}><div className="car-no">0{i+1}</div><CarIcon car={c}/><div className="car-copy"><small>{c.type}</small><h3>{c.name}</h3><div className="stat"><span>TOP SPEED</span><i><b style={{width:`${c.speed*82}%`}}/></i></div><div className="stat"><span>HANDLING</span><i><b style={{width:`${c.grip*92}%`}}/></i></div></div><span className="select-tick">✓</span></button>)}</div><button className="drive-btn" onClick={()=>setView('game')}><span>DRIVE {CARS[selected].name}</span><b>ENTER CITY ↗</b></button></section>}
    {settings&&<div className="modal-wrap" onClick={()=>setSettings(false)}><section className="settings" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSettings(false)}>×</button><p className="eyebrow">Tune your experience</p><h2>Settings</h2><div className="setting-row"><span>Sound</span><button className={sound?'toggle on':'toggle'} onClick={()=>setSound(!sound)}><i/></button></div><div className="setting-row"><span>Graphics</span><div className="segments">{['Low','Medium','High'].map(q=><button className={quality===q?'active':''} onClick={()=>setQuality(q)} key={q}>{q}</button>)}</div></div><button className="save" onClick={()=>setSettings(false)}>Save & close</button></section></div>}
  </main>
}
