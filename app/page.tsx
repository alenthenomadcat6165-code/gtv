'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

type CarSpec = { name:string; type:string; color:string; accent:string; speed:number; grip:number; boost:number };
type Tune = { color:string; rims:'silver'|'graphite'|'gold'|'bronze'|'white'|'chrome'; kit:'stock'|'street'|'wide'; spoiler:boolean; glass:'clear'|'smoke'|'dark'; lights:'white'|'ice'|'amber'; trim:'black'|'chrome'|'carbon'; stance:'low'|'stock'|'high'; engine:number; brakes:number; suspension:number };
const CARS: CarSpec[] = [
  { name:'Tempest', type:'SUPERCAR', color:'#f6b900', accent:'#121310', speed:1.08, grip:.86, boost:1.12 },
  { name:'Metro Box', type:'CITY VAN', color:'#f3f4ef', accent:'#161c1d', speed:.68, grip:.82, boost:.72 },
  { name:'Sovereign', type:'LUXURY', color:'#ecebe6', accent:'#252321', speed:.87, grip:.8, boost:.9 },
  { name:'Bluebolt', type:'MUSCLE', color:'#708fc8', accent:'#11151c', speed:.98, grip:.7, boost:1.05 },
  { name:'City Giant', type:'DOUBLE DECKER', color:'#d8e539', accent:'#18201a', speed:.52, grip:.62, boost:.5 },
  { name:'Hall Pass', type:'SCHOOL BUS', color:'#f2b51d', accent:'#171717', speed:.48, grip:.66, boost:.45 },
];

function CarIcon({car,tune}:{car:CarSpec;tune?:Tune}) {
  const rim=tune?.rims==='gold'?'#d5a83d':tune?.rims==='bronze'?'#9a6738':tune?.rims==='graphite'?'#292d2c':tune?.rims==='white'?'#f1f2ed':tune?.rims==='chrome'?'#dce8e6':'#aeb9b5';
  return <div className={`car-icon ${car.type.toLowerCase().replaceAll(' ','-')} ${tune?.kit||'stock'} ${tune?.stance||'stock'} ${tune?.spoiler?'has-spoiler':'no-spoiler'}`} style={{'--car':tune?.color||car.color,'--accent':car.accent,'--rim':rim,'--glass':tune?.glass==='dark'?'#050808':tune?.glass==='smoke'?'#213033':'#a8cfd0'} as React.CSSProperties}><i className="spoiler"/><i className="cabin"/><i className="body"/><i className="wheel a"/><i className="wheel b"/></div>
}

function CityGame({car,tune,onExit,sound}:{car:CarSpec;tune:Tune;onExit:()=>void;sound:boolean}) {
  const mount = useRef<HTMLDivElement>(null);
  const [speed, setSpeed] = useState(0);
  const [score, setScore] = useState(0);
  const [air, setAir] = useState(false);
  const [damage, setDamage] = useState(0);
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
    const markingMat=new THREE.MeshBasicMaterial({color:0xf4f2d8});
    const arrowShape=new THREE.Shape();arrowShape.moveTo(-1,-3);arrowShape.lineTo(1,-3);arrowShape.lineTo(1,.5);arrowShape.lineTo(2.4,.5);arrowShape.lineTo(0,3.2);arrowShape.lineTo(-2.4,.5);arrowShape.lineTo(-1,.5);arrowShape.closePath();
    const arrowGeo=new THREE.ShapeGeometry(arrowShape);
    for(let ix=-2;ix<=2;ix++)for(let iz=-2;iz<=2;iz++){const x=ix*72,z=iz*72;for(const side of [-1,1]){const stopA=new THREE.Mesh(new THREE.PlaneGeometry(7,.7),markingMat);stopA.rotation.x=-Math.PI/2;stopA.position.set(x+side*5,.045,z+side*13);scene.add(stopA);const arrowA=new THREE.Mesh(arrowGeo,markingMat);arrowA.rotation.x=-Math.PI/2;arrowA.rotation.z=side<0?Math.PI:0;arrowA.position.set(x+side*4,.05,z+side*23);scene.add(arrowA);const stopB=new THREE.Mesh(new THREE.PlaneGeometry(.7,7),markingMat);stopB.rotation.x=-Math.PI/2;stopB.position.set(x+side*13,.046,z-side*5);scene.add(stopB);const arrowB=new THREE.Mesh(arrowGeo,markingMat);arrowB.rotation.x=-Math.PI/2;arrowB.rotation.z=side<0?-Math.PI/2:Math.PI/2;arrowB.position.set(x+side*23,.051,z-side*4);scene.add(arrowB)}}

    const blockers: {x:number;z:number,hx:number;hz:number}[]=[];
    const geoCache:Record<string,THREE.BoxGeometry>={};
    const palette=[0x263338,0x374247,0x43443d,0x314b4a,0x505047];
    const rand=(x:number,z:number)=>Math.abs(Math.sin(x*12.9898+z*78.233)*43758.5453)%1;
    const stuntLots=new Set(['-36,-36','36,36','108,-108','-108,108']);
    const parkingLots=new Set(['180,-180','-180,180']);
    for(let gx=-3;gx<3;gx++) for(let gz=-3;gz<3;gz++){
      const cx=gx*72+36, cz=gz*72+36;
      const isStuntLot=stuntLots.has(`${cx},${cz}`);
      const isParkingLot=parkingLots.has(`${cx},${cz}`);
      const buildingSpots=isStuntLot||isParkingLot?[]:(gx+gz)%2===0?[[-14,-13],[15,14]]:[[14,-14],[-14,14]];
      for(const [ox,oz] of buildingSpots){
        const h=18+rand(cx+ox,cz+oz)*52,w=18+rand(ox,cx)*4,dep=18+rand(oz,cz)*4;
        const key=`${Math.round(w)}-${Math.round(h)}-${Math.round(dep)}`; const geo=geoCache[key]||(geoCache[key]=new THREE.BoxGeometry(w,h,dep));
        const mat=new THREE.MeshStandardMaterial({color:palette[Math.floor(rand(cx+ox*2,cz+oz)*palette.length)],roughness:.7,metalness:.08});
        const b=new THREE.Mesh(geo,mat);b.position.set(cx+ox,h/2,cz+oz);b.castShadow=true;b.receiveShadow=true;scene.add(b);blockers.push({x:b.position.x,z:b.position.z,hx:w/2+2.2,hz:dep/2+2.2});
        const faceZ=b.position.z+Math.sign(oz||1)*(dep/2+.04),windowMat=new THREE.MeshStandardMaterial({color:0x9fd4d0,emissive:0x31595a,emissiveIntensity:.55,roughness:.22});const floors=Math.min(8,Math.floor(h/5));
        for(let floor=1;floor<=floors;floor++)for(const wx of [-w*.28,0,w*.28]){const win=new THREE.Mesh(new THREE.PlaneGeometry(2.3,2.2),windowMat);win.position.set(b.position.x+wx,2.4+floor*4,faceZ);if(oz<0)win.rotation.y=Math.PI;scene.add(win)}
        const faceX=b.position.x+Math.sign(ox||1)*(w/2+.04);for(let floor=1;floor<=floors;floor++)for(const wz of [-dep*.24,dep*.24]){const win=new THREE.Mesh(new THREE.PlaneGeometry(2.3,2.2),windowMat);win.position.set(faceX,2.4+floor*4,b.position.z+wz);win.rotation.y=ox>0?Math.PI/2:-Math.PI/2;scene.add(win)}
        const door=new THREE.Mesh(new THREE.PlaneGeometry(2.5,3.7),new THREE.MeshStandardMaterial({color:0x181f20,metalness:.5}));door.position.set(b.position.x,1.9,faceZ+(oz>0?.02:-.02));if(oz<0)door.rotation.y=Math.PI;scene.add(door);
        for(let floor=2;floor<=floors;floor+=2){const balcony=new THREE.Mesh(new THREE.BoxGeometry(w*.42,.22,1.7),new THREE.MeshStandardMaterial({color:0x59615d,metalness:.3}));balcony.position.set(b.position.x,2.1+floor*4,faceZ+Math.sign(oz)*.8);scene.add(balcony);const rail=new THREE.Mesh(new THREE.BoxGeometry(w*.42,1,.12),new THREE.MeshStandardMaterial({color:0x1e2929,metalness:.7}));rail.position.set(b.position.x,2.65+floor*4,faceZ+Math.sign(oz)*1.58);scene.add(rail)}
      }
      const plaza=new THREE.Mesh(isStuntLot||isParkingLot?new THREE.BoxGeometry(51,.25,51):new THREE.CylinderGeometry(12,12,.25,24),new THREE.MeshStandardMaterial({color:isStuntLot?0x72766b:isParkingLot?0x292e2d:0x43583a,roughness:1}));plaza.position.set(cx,.13,cz);scene.add(plaza);
      if(isParkingLot)for(let p=-18;p<=18;p+=6){const line=new THREE.Mesh(new THREE.PlaneGeometry(.18,8),markingMat);line.rotation.x=-Math.PI/2;line.position.set(cx+p,.27,cz-12);scene.add(line);const line2=line.clone();line2.position.z=cz+12;scene.add(line2)}
    }
    // perimeter landmarks
    for(let i=0;i<35;i++){const angle=i/35*Math.PI*2,rad=250+rand(i,7)*45,h=35+rand(i,3)*95;const b=new THREE.Mesh(new THREE.BoxGeometry(22,h,22),new THREE.MeshStandardMaterial({color:palette[i%palette.length]}));b.position.set(Math.cos(angle)*rad,h/2,Math.sin(angle)*rad);scene.add(b);blockers.push({x:b.position.x,z:b.position.z,hx:13.2,hz:13.2})}

    const rampZones:{x:number;z:number;angle:number;width:number;length:number;height:number;kind:string}[]=[];
    function addRamp(x:number,z:number,angle:number,kind:'street'|'wide'|'kicker'){const specs=kind==='wide'?{width:15,length:18,height:4}:kind==='kicker'?{width:9,length:13,height:5}:{width:10,length:20,height:4.2},g=new THREE.Group(),slope=Math.atan2(specs.height,specs.length);const ramp=new THREE.Mesh(new THREE.BoxGeometry(specs.width,.7,specs.length),new THREE.MeshStandardMaterial({color:kind==='kicker'?0xff713b:kind==='wide'?0xb7b8ff:0xd6ff3f,roughness:.55}));ramp.rotation.x=slope;ramp.position.y=specs.height/2;ramp.castShadow=true;g.add(ramp);for(const s of [-specs.width*.3,0,specs.width*.3]){const stripe=new THREE.Mesh(new THREE.BoxGeometry(.7,.72,specs.length+.1),new THREE.MeshBasicMaterial({color:0x161b18}));stripe.rotation.x=slope;stripe.position.set(s,specs.height/2+.03,0);g.add(stripe)}if(kind==='kicker'){const lip=new THREE.Mesh(new THREE.BoxGeometry(specs.width+.5,.45,2.2),new THREE.MeshStandardMaterial({color:0xffd23f}));lip.position.set(0,specs.height-.15,-specs.length/2+.6);lip.rotation.x=slope;g.add(lip)}g.position.set(x,0,z);g.rotation.y=angle;scene.add(g);rampZones.push({x,z,angle,...specs,kind})}
    addRamp(-36,-36,0,'street');addRamp(36,36,Math.PI,'wide');addRamp(108,-108,Math.PI/2,'kicker');addRamp(-108,108,-Math.PI/2,'street');
    const trafficBulbs:{red:THREE.MeshBasicMaterial;amber:THREE.MeshBasicMaterial;green:THREE.MeshBasicMaterial;offset:number}[]=[];
    function addTrafficLight(x:number,z:number,rot:number,offset:number){const g=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.16,.2,5.5,8),new THREE.MeshStandardMaterial({color:0x171c19,metalness:.7}));pole.position.y=2.75;g.add(pole);const box=new THREE.Mesh(new THREE.BoxGeometry(1.05,2.5,.75),new THREE.MeshStandardMaterial({color:0x111411}));box.position.set(0,5.5,0);g.add(box);const mats=[new THREE.MeshBasicMaterial({color:0x2a0907}),new THREE.MeshBasicMaterial({color:0x281d05}),new THREE.MeshBasicMaterial({color:0x08250d})];[-.7,0,.7].forEach((oy,i)=>{const bulb=new THREE.Mesh(new THREE.SphereGeometry(.25,12,8),mats[i]);bulb.position.set(0,5.5-oy,-.4);g.add(bulb)});g.position.set(x,.02,z);g.rotation.y=rot;scene.add(g);blockers.push({x,z,hx:.45,hz:.45});trafficBulbs.push({red:mats[0],amber:mats[1],green:mats[2],offset})}
    function addStopSign(x:number,z:number,rot:number){const g=new THREE.Group();const post=new THREE.Mesh(new THREE.CylinderGeometry(.1,.13,3.5,8),new THREE.MeshStandardMaterial({color:0xadb3aa,metalness:.75}));post.position.y=1.75;g.add(post);const sign=new THREE.Mesh(new THREE.CylinderGeometry(.85,.85,.13,8),new THREE.MeshStandardMaterial({color:0xd32621,emissive:0x310403,emissiveIntensity:.25}));sign.rotation.x=Math.PI/2;sign.position.set(0,3.5,0);g.add(sign);const center=new THREE.Mesh(new THREE.CircleGeometry(.55,8),new THREE.MeshBasicMaterial({color:0xf4eee5,wireframe:true}));center.position.set(0,3.5,-.08);g.add(center);g.position.set(x,0,z);g.rotation.y=rot;scene.add(g);blockers.push({x,z,hx:.35,hz:.35})}
    function addStreetLight(x:number,z:number){const poleMat=new THREE.MeshStandardMaterial({color:0x252c29,metalness:.8}),g=new THREE.Group();const pole=new THREE.Mesh(new THREE.CylinderGeometry(.11,.16,7,8),poleMat);pole.position.y=3.5;g.add(pole);const arm=new THREE.Mesh(new THREE.BoxGeometry(2.2,.14,.14),poleMat);arm.position.set(.95,6.8,0);g.add(arm);const lamp=new THREE.Mesh(new THREE.SphereGeometry(.34,12,8),new THREE.MeshBasicMaterial({color:0xfff2b0}));lamp.position.set(2,6.62,0);g.add(lamp);const glow=new THREE.PointLight(0xffeeb1,1.4,24,2);glow.position.copy(lamp.position);g.add(glow);g.position.set(x,0,z);scene.add(g);blockers.push({x,z,hx:.35,hz:.35})}
    for(let ix=-2;ix<=2;ix++)for(let iz=-2;iz<=2;iz++){const x=ix*72,z=iz*72;addTrafficLight(x-11,z-11,0,(ix+iz)&1);addTrafficLight(x+11,z+11,Math.PI,(ix+iz+1)&1);addStopSign(x+11,z-11,Math.PI/2);addStreetLight(x-14,z+14)}

    const vehicle=new THREE.Group();scene.add(vehicle);const isBus=car.type==='DOUBLE DECKER'||car.type==='SCHOOL BUS',isSuper=car.type==='SUPERCAR',isLuxury=car.type==='LUXURY',isMuscle=car.type==='MUSCLE';
    const modelFiles:Record<string,string>={'SUPERCAR':'tempest.glb','CITY VAN':'metro-box.glb','LUXURY':'sovereign.glb','MUSCLE':'bluebolt.glb','DOUBLE DECKER':'city-giant.glb','SCHOOL BUS':'hall-pass.glb'};const wheelData:{obj:THREE.Object3D;base:THREE.Quaternion;front:boolean}[]=[];let modelRoot:THREE.Object3D|null=null;
    const rimColor=tune.rims==='gold'?0xd5a83d:tune.rims==='bronze'?0x9a6738:tune.rims==='graphite'?0x242827:tune.rims==='white'?0xf2f3ef:tune.rims==='chrome'?0xdce8e6:0xbfc5bf,glassColor=tune.glass==='dark'?0x030707:tune.glass==='smoke'?0x182729:0x91bdc2,lightColor=tune.lights==='ice'?0x9eeaff:tune.lights==='amber'?0xffb02e:0xffffff,trimColor=tune.trim==='chrome'?0xd5dcda:tune.trim==='carbon'?0x151a19:0x080a09,baseRide=tune.stance==='low'?-.18:tune.stance==='high'?.24:0;
    new GLTFLoader().load(`/models/${modelFiles[car.type]}`,(gltf)=>{modelRoot=gltf.scene;modelRoot.rotation.y=Math.PI;const baseScale=isBus?1.18:1.45,widthScale=tune.kit==='wide'?1.1:tune.kit==='street'?1.04:1;modelRoot.scale.set(baseScale*widthScale,baseScale,baseScale);modelRoot.position.y=baseRide;modelRoot.traverse(obj=>{const mesh=obj as THREE.Mesh;if(mesh.isMesh){mesh.castShadow=true;mesh.receiveShadow=true;const mats=Array.isArray(mesh.material)?mesh.material:[mesh.material];if(mats.length&&mats.every(material=>material.name.toLowerCase().includes('interior'))){mesh.visible=false;return}const cloned=mats.map(material=>{const m=material.clone() as THREE.MeshStandardMaterial,n=m.name.toLowerCase();if(n.includes('paint')||n==='azure')m.color=new THREE.Color(tune.color);if((n.includes('alloy')||n==='steel')&&obj.name.toLowerCase().includes('wheel'))m.color=new THREE.Color(rimColor);if(n.includes('glass')){m.color=new THREE.Color(glassColor);m.opacity=tune.glass==='dark'?.72:tune.glass==='smoke'?.58:.4;m.transparent=true}if(n.includes('lightwhite')){m.color=new THREE.Color(lightColor);m.emissive=new THREE.Color(lightColor);m.emissiveIntensity=1.4}if(n==='trim'){m.color=new THREE.Color(trimColor);m.metalness=tune.trim==='chrome'?.95:tune.trim==='carbon'?.25:.5;m.roughness=tune.trim==='chrome'?.12:.38}return m});mesh.material=Array.isArray(mesh.material)?cloned:cloned[0]}const clean=obj.name.toLowerCase();if(/^wheel-(front|rear)-(right|left|l|r)$/.test(clean))wheelData.push({obj,base:obj.quaternion.clone(),front:clean.includes('front')})});vehicle.add(modelRoot!);if(tune.spoiler&&!isBus&&(isSuper||isMuscle||isLuxury)){const dark=new THREE.MeshStandardMaterial({color:new THREE.Color(car.accent),metalness:.55,roughness:.25}),z=isSuper?3.2:isLuxury?3.55:3.35,y=isSuper?1.85:2;const wing=new THREE.Mesh(new THREE.BoxGeometry(isSuper?3.6:3.3,.13,.48),dark);wing.position.set(0,y,z);vehicle.add(wing);for(const x of [-1.1,1.1]){const support=new THREE.Mesh(new THREE.BoxGeometry(.12,.48,.12),dark);support.position.set(x,y-.24,z);vehicle.add(support)}}},undefined,()=>setMessage('Vehicle model could not load'));
    const boostGlow=new THREE.Mesh(new THREE.PlaneGeometry(isBus?3.5:2.5,isBus?10:6.5),new THREE.MeshBasicMaterial({color:0xd6ff3f,transparent:true,opacity:0,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));boostGlow.rotation.x=-Math.PI/2;boostGlow.position.set(0,.12,isBus?7:4.8);vehicle.add(boostGlow);

    const wheelYawQ=new THREE.Quaternion(),wheelRollQ=new THREE.Quaternion(),bodyYawQ=new THREE.Quaternion(),bodyPitchQ=new THREE.Quaternion(),wheelUp=new THREE.Vector3(0,1,0),wheelAxle=new THREE.Vector3(1,0,0);
    const keys:Record<string,boolean>={};let heading=0,velocity=0,velX=0,velZ=0,y=0,vy=0,pitch=0,roll=0,airborne=false,last=performance.now(),points=0,boost=100,touchSteer=0,touchGas=0,camYaw=0,camHeight=7,camDistance=13,dragging=false,lastPointerX=0,lastPointerY=0,activeRamp:{r:typeof rampZones[number]}|null=null,landingKick=0,wheelSpin=0,steeringAngle=0,damageValue=0,lastCrashAt=0,suspensionBounce=0;
    const carRadius=isBus?2.25:1.55;
    const collides=(x:number,z:number)=>Math.abs(x)>310-carRadius||Math.abs(z)>310-carRadius||blockers.some(b=>Math.abs(x-b.x)<b.hx+carRadius&&Math.abs(z-b.z)<b.hz+carRadius);
    const addDamage=(amount:number,label:string)=>{if(amount<=0)return;damageValue=Math.min(100,damageValue+amount);setDamage(Math.round(damageValue));setMessage(label)};
    const down=(e:KeyboardEvent)=>{keys[e.code]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault();if(e.code==='KeyR')reset()};const up=(e:KeyboardEvent)=>{keys[e.code]=false};addEventListener('keydown',down);addEventListener('keyup',up);
    function reset(){vehicle.position.set(0,0,12);heading=0;velocity=0;velX=0;velZ=0;y=0;vy=0;pitch=0;roll=0;activeRamp=null;setMessage('Back on the road')}
    reset();
    const touch=(ev:Event)=>{const el=ev.currentTarget as HTMLElement;const k=el.dataset.key||'';const on=ev.type==='pointerdown';keys[k]=on;if(on)el.setPointerCapture((ev as PointerEvent).pointerId)};
    host.parentElement?.querySelectorAll<HTMLElement>('[data-key]').forEach(el=>{el.addEventListener('pointerdown',touch);el.addEventListener('pointerup',touch);el.addEventListener('pointercancel',touch)});
    const canvas=renderer.domElement;
    const pointerDown=(e:PointerEvent)=>{dragging=true;lastPointerX=e.clientX;lastPointerY=e.clientY;canvas.setPointerCapture(e.pointerId);canvas.classList.add('dragging')};
    const pointerMove=(e:PointerEvent)=>{if(!dragging)return;camYaw-=(e.clientX-lastPointerX)*.006;camHeight=THREE.MathUtils.clamp(camHeight+(e.clientY-lastPointerY)*.025,3.5,14);lastPointerX=e.clientX;lastPointerY=e.clientY};
    const pointerUp=(e:PointerEvent)=>{dragging=false;if(canvas.hasPointerCapture(e.pointerId))canvas.releasePointerCapture(e.pointerId);canvas.classList.remove('dragging')};
    const wheelZoom=(e:WheelEvent)=>{camDistance=THREE.MathUtils.clamp(camDistance+e.deltaY*.012,8,22)};
    canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('wheel',wheelZoom,{passive:true});

    function animate(now:number){const dt=Math.min((now-last)/1000,.04);last=now;const throttle=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0)+touchGas;const steer=(keys.KeyA||keys.ArrowLeft?1:0)-(keys.KeyD||keys.ArrowRight?1:0)+touchSteer;const boosting=(keys.ShiftLeft||keys.ShiftRight)&&boost>0;
      const condition=Math.max(.55,1-damageValue*.0045),fx=-Math.sin(heading),fz=-Math.cos(heading),rx=Math.cos(heading),rz=-Math.sin(heading);let longitudinal=velX*fx+velZ*fz;let lateral=velX*rx+velZ*rz;const max=34*car.speed*(1+tune.engine*.045)*condition*(boosting?1.42:1),engineForce=23*car.speed*(1+tune.engine*.09)*condition;
      if(throttle>0)longitudinal+=engineForce*(boosting?1.42:1)*dt;else if(throttle<0){if(longitudinal>.4)longitudinal-= (24+tune.brakes*5)*dt;else longitudinal-=15*dt}else longitudinal*=Math.pow(.985,dt*60);
      longitudinal=THREE.MathUtils.clamp(longitudinal,-12,max);const handbrake=!!keys.Space;const lateralGrip=handbrake?.90:(.70+Math.min(.96,car.grip+tune.suspension*.025)*.24);lateral*=Math.pow(lateralGrip,dt*60);longitudinal*=Math.pow(.996,dt*60);const targetSteer=steer*(handbrake?.58:.42);steeringAngle=THREE.MathUtils.lerp(steeringAngle,targetSteer,1-Math.exp(-7.5*dt));if(Math.abs(longitudinal)>.35)heading+=steeringAngle*(longitudinal/5.1)*dt;
      const nfx=-Math.sin(heading),nfz=-Math.cos(heading),nrx=Math.cos(heading),nrz=-Math.sin(heading);velX=nfx*longitudinal+nrx*lateral;velZ=nfz*longitudinal+nrz*lateral;velocity=longitudinal;if(boosting&&Math.abs(velocity)>5)boost=Math.max(0,boost-30*dt);else boost=Math.min(100,boost+8*dt);
      const travelDistance=Math.hypot(velX,velZ)*dt,moveSteps=Math.max(1,Math.ceil(travelDistance/.65)),stepX=velX*dt/moveSteps,stepZ=velZ*dt/moveSteps;let crashed=false;for(let step=0;step<moveSteps;step++){const tryX=vehicle.position.x+stepX;if(!collides(tryX,vehicle.position.z))vehicle.position.x=tryX;else{velX*=-.16;crashed=true}const tryZ=vehicle.position.z+stepZ;if(!collides(vehicle.position.x,tryZ))vehicle.position.z=tryZ;else{velZ*=-.16;crashed=true}}if(crashed&&now-lastCrashAt>450){const impact=Math.hypot(velX,velZ)+Math.abs(velocity);addDamage(Math.max(2,impact*.65),'CRASH DAMAGE');lastCrashAt=now;landingKick=.35}velocity=velX*(-Math.sin(heading))+velZ*(-Math.cos(heading));
      if(!airborne&&!activeRamp){for(const r of rampZones){const dx=vehicle.position.x-r.x,dz=vehicle.position.z-r.z,localX=Math.cos(r.angle)*dx-Math.sin(r.angle)*dz,localZ=Math.sin(r.angle)*dx+Math.cos(r.angle)*dz;if(Math.abs(localX)<r.width/2+.5&&Math.abs(localZ)<r.length/2+.5){activeRamp={r};setMessage(`${r.kind.toUpperCase()} RAMP`);break}}}
      if(activeRamp&&!airborne){const r=activeRamp.r,dx=vehicle.position.x-r.x,dz=vehicle.position.z-r.z,localX=Math.cos(r.angle)*dx-Math.sin(r.angle)*dz,localZ=Math.sin(r.angle)*dx+Math.cos(r.angle)*dz,localTravel=Math.sin(r.angle)*velX+Math.cos(r.angle)*velZ,progress=THREE.MathUtils.clamp((r.length/2-localZ)/r.length,0,1),slope=Math.atan2(r.height,r.length);if(Math.abs(localX)>r.width/2+1||Math.abs(localZ)>r.length/2+2){activeRamp=null;y=0}else if(localTravel>0&&progress>.86){velX*=-.15;velZ*=-.15;activeRamp=null;y=0;setMessage('USE THE LOW SIDE')}else{y=progress*r.height;roll=0;pitch=THREE.MathUtils.lerp(pitch,slope,.32);const gravityAlongRamp=9.81*Math.sin(slope)*dt;velX+=Math.sin(r.angle)*gravityAlongRamp;velZ+=Math.cos(r.angle)*gravityAlongRamp;if(progress>.98&&localTravel<0){const takeoffSpeed=Math.abs(localTravel),horizontalSpeed=takeoffSpeed*Math.cos(slope);velX=-Math.sin(r.angle)*horizontalSpeed;velZ=-Math.cos(r.angle)*horizontalSpeed;velocity=horizontalSpeed;vy=takeoffSpeed*Math.sin(slope);airborne=true;activeRamp=null;setAir(true);setMessage('AIR TIME')}}}
      if(airborne){vy-=22*dt;y+=vy*dt;pitch+=velocity*.012*dt;roll=0;if(y<=0){const impact=Math.max(0,-vy),gain=Math.round(Math.abs(pitch)*300+100),rebound=impact*(.1+tune.suspension*.012);y=.015;suspensionBounce=-Math.min(.34,impact*.018);landingKick=Math.min(.9,impact*.035);if(impact>7)addDamage((impact-7)*1.8,impact>15?'HEAVY LANDING — BODY DAMAGED':'HARD LANDING');else setMessage(`LANDED +${gain}`);points+=gain;setScore(points);pitch=0;roll=0;if(rebound>1.35){vy=rebound;airborne=true}else{vy=0;airborne=false;y=0;setAir(false)}}}
      if(!airborne&&!activeRamp){roll=0;pitch=THREE.MathUtils.lerp(pitch,-throttle*.02,1-Math.pow(.01,dt))}
      landingKick=Math.max(0,landingKick-dt*2.4);suspensionBounce=THREE.MathUtils.lerp(suspensionBounce,0,1-Math.pow(.001,dt));vehicle.position.y=y;bodyYawQ.setFromAxisAngle(wheelUp,heading);bodyPitchQ.setFromAxisAngle(wheelAxle,pitch);vehicle.quaternion.copy(bodyYawQ).multiply(bodyPitchQ);if(modelRoot)modelRoot.position.y=baseRide+suspensionBounce;wheelSpin+=velocity*dt/.72;wheelData.forEach(w=>{wheelYawQ.setFromAxisAngle(wheelUp,w.front?steeringAngle:0);wheelRollQ.setFromAxisAngle(wheelAxle,wheelSpin);w.obj.quaternion.copy(w.base).multiply(wheelYawQ).multiply(wheelRollQ)});trafficBulbs.forEach((l,i)=>{const phase=(Math.floor(now/5000)+l.offset)%2;l.red.color.setHex(phase?0xff2416:0x2a0907);l.amber.color.setHex((now%5000)>4200?0xffaa18:0x281d05);l.green.color.setHex(!phase?0x32ff62:0x08250d)});boostGlow.material.opacity=THREE.MathUtils.lerp(boostGlow.material.opacity,boosting?.55:0,.18);boostGlow.scale.y=boosting?1+Math.sin(now*.025)*.18:1;
      const orbitHeading=heading+camYaw;const desired=new THREE.Vector3(vehicle.position.x+Math.sin(orbitHeading)*camDistance,vehicle.position.y+camHeight-landingKick,vehicle.position.z+Math.cos(orbitHeading)*camDistance);camera.position.lerp(desired,1-Math.pow(.002,dt));camera.fov=THREE.MathUtils.lerp(camera.fov,boosting?72:62,.06);camera.updateProjectionMatrix();camera.lookAt(vehicle.position.x,vehicle.position.y+1.6,vehicle.position.z);
      if(Math.floor(now/100)%4===0)setSpeed(Math.round(Math.abs(velocity)*3.1)); const meter=host.parentElement?.querySelector<HTMLElement>('.boost-fill');if(meter)meter.style.width=`${boost}%`;
      renderer.render(scene,camera);requestAnimationFrame(animate)}
    const raf=requestAnimationFrame(animate);const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight)};addEventListener('resize',resize);
    return()=>{cancelAnimationFrame(raf);removeEventListener('resize',resize);removeEventListener('keydown',down);removeEventListener('keyup',up);canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('wheel',wheelZoom);renderer.dispose();host.removeChild(renderer.domElement)};
  },[car,tune]);

  return <div className="game-screen">
    <div className="game-canvas" ref={mount}/>
    <div className="game-top"><button className="exit" onClick={onExit}>← Garage</button><div className="game-logo">GTV</div><div className="sound-state">{sound?'SOUND ON':'MUTED'}</div></div>
    <div className="stunt-callout"><span>{air?'STUNT IN PROGRESS':message}</span><strong>{score.toLocaleString()} PTS</strong></div>
    <div className="speedo"><b>{speed}</b><span>KM/H</span><div className="boost-label">BOOST</div><div className="boost-track"><i className="boost-fill"/></div><div className="damage-label"><span>BODY DAMAGE</span><b>{damage}%</b></div><div className="damage-track"><i style={{width:`${damage}%`}}/></div></div>
    <div className="controls-hint"><span><kbd>WASD</kbd> DRIVE</span><span><kbd>DRAG</kbd> CAMERA</span><span><kbd>SCROLL</kbd> ZOOM</span><span><kbd>SPACE</kbd> DRIFT</span><span><kbd>SHIFT</kbd> BOOST</span><span><kbd>R</kbd> RESET</span></div>
    <div className="touch-controls"><div><button data-key="KeyA">←</button><button data-key="KeyD">→</button></div><div><button data-key="KeyS">▼</button><button data-key="KeyW">▲</button></div></div>
  </div>
}

function CustomizeModal({car,tune,onChange,onClose}:{car:CarSpec;tune:Tune;onChange:(patch:Partial<Tune>)=>void;onClose:()=>void}){
  const [tab,setTab]=useState<'appearance'|'build'>('appearance');
  const colors=['#f6b900','#ff7a21','#e34a3d','#e95f9c','#a77ee8','#708fc8','#2f62d0','#20b9d1','#28a96b','#d6ff3f','#f3f4ef','#9ca6aa','#4b5052','#16191a'];
  return <div className="customize-wrap"><section className="customize-bay">
    <header><div><p className="eyebrow">GTV Customs</p><h2>{car.name}</h2></div><button onClick={onClose}>DONE ×</button></header>
    <div className="custom-preview"><div className="turntable"><CarIcon car={{...car,color:tune.color}} tune={tune}/></div><div className="build-summary"><span>BUILD RATING</span><b>{Math.round((car.speed+car.grip)*40+(tune.engine+tune.brakes+tune.suspension)*4)}</b><small>{tune.kit.toUpperCase()} / {tune.rims.toUpperCase()} RIMS</small></div></div>
    <nav className="custom-tabs"><button className={tab==='appearance'?'active':''} onClick={()=>setTab('appearance')}>APPEARANCE</button><button className={tab==='build'?'active':''} onClick={()=>setTab('build')}>PERFORMANCE</button></nav>
    {tab==='appearance'?<div className="custom-options">
      <div className="option-group"><label>PAINT</label><div className="swatches">{colors.map(c=><button key={c} aria-label={`Paint ${c}`} className={tune.color===c?'active':''} style={{background:c}} onClick={()=>onChange({color:c})}/>)}</div></div>
      <div className="option-group"><label>BODY KIT</label><div className="choice-row">{(['stock','street','wide'] as const).map(v=><button key={v} className={tune.kit===v?'active':''} onClick={()=>onChange({kit:v})}>{v}</button>)}</div></div>
      <div className="option-group"><label>RIMS</label><div className="choice-row choice-wrap">{(['silver','graphite','gold','bronze','white','chrome'] as const).map(v=><button key={v} className={tune.rims===v?'active':''} onClick={()=>onChange({rims:v})}>{v}</button>)}</div></div>
      <div className="option-group"><label>SPOILER</label><button className={tune.spoiler?'part-toggle active':'part-toggle'} onClick={()=>onChange({spoiler:!tune.spoiler})}>{tune.spoiler?'INSTALLED':'OFF'}</button></div>
      <div className="option-group"><label>WINDOW TINT</label><div className="choice-row">{(['clear','smoke','dark'] as const).map(v=><button key={v} className={tune.glass===v?'active':''} onClick={()=>onChange({glass:v})}>{v}</button>)}</div></div>
      <div className="option-group"><label>HEADLIGHTS</label><div className="choice-row">{(['white','ice','amber'] as const).map(v=><button key={v} className={tune.lights===v?'active':''} onClick={()=>onChange({lights:v})}>{v}</button>)}</div></div>
      <div className="option-group"><label>TRIM</label><div className="choice-row">{(['black','chrome','carbon'] as const).map(v=><button key={v} className={tune.trim===v?'active':''} onClick={()=>onChange({trim:v})}>{v}</button>)}</div></div>
      <div className="option-group"><label>STANCE</label><div className="choice-row">{(['low','stock','high'] as const).map(v=><button key={v} className={tune.stance===v?'active':''} onClick={()=>onChange({stance:v})}>{v}</button>)}</div></div>
    </div>:<div className="custom-options build-options">{(['engine','brakes','suspension'] as const).map(part=><div className="upgrade" key={part}><div><label>{part}</label><small>LEVEL {tune[part]} / 5</small></div><div className="level-pips">{[1,2,3,4,5].map(level=><button key={level} className={level<=tune[part]?'filled':''} onClick={()=>onChange({[part]:level})}/>)}</div><button className="upgrade-button" onClick={()=>onChange({[part]:Math.min(5,tune[part]+1)})}>UPGRADE +</button></div>)}</div>}
  </section></div>
}

export default function Home(){
  const [view,setView]=useState<'home'|'garage'|'game'>('home');const [selected,setSelected]=useState(0);const [settings,setSettings]=useState(false);const [customizing,setCustomizing]=useState(false);const [sound,setSound]=useState(true);const [quality,setQuality]=useState('High');const [tunes,setTunes]=useState<Tune[]>(()=>CARS.map(c=>({color:c.color,rims:'silver',kit:'stock',spoiler:c.type==='SUPERCAR'||c.type==='MUSCLE',glass:'smoke',lights:'white',trim:'black',stance:'stock',engine:1,brakes:1,suspension:1})));
  const updateTune=(patch:Partial<Tune>)=>setTunes(all=>all.map((t,i)=>i===selected?{...t,...patch}:t));
  if(view==='game')return <CityGame car={CARS[selected]} tune={tunes[selected]} onExit={()=>setView('garage')} sound={sound}/>;
  return <main className={view==='garage'?'garage-shell':'home-shell'}>
    <div className="sky-glow"/><nav className="topbar"><button className="brand-mark" onClick={()=>setView('home')}>GTV</button><span className="status-pill"><i/> City online</span></nav>
    {view==='home'?<>
      <section className="hero"><p className="eyebrow">No missions. No limits.</p><h1>Grand Theft<br/><em>Vehicles</em></h1><p className="lede">Pick a ride. Find a ramp. Make the city your playground.</p><div className="home-actions"><button className="primary" onClick={()=>setView('garage')}>Play now <span>↗</span></button><button className="secondary" onClick={()=>setSettings(true)}>Settings <span>⚙</span></button></div></section>
      <div className="city-silhouette" aria-hidden="true"><span/><span/><span/><span/><span/><span/><span/><span/></div><footer><span>Open world driving</span><span>Free roam</span><span>Built for the browser</span></footer>
    </>:<section className="garage"><div className="garage-heading"><button onClick={()=>setView('home')}>← Back</button><div><p className="eyebrow">Choose your weapon</p><h2>Pick a ride</h2></div><span>06 / 06</span></div><div className="car-grid">{CARS.map((c,i)=><button key={c.name} className={`car-card ${selected===i?'selected':''}`} onClick={()=>setSelected(i)}><div className="car-no">0{i+1}</div><CarIcon car={c} tune={tunes[i]}/><div className="car-copy"><small>{c.type}</small><h3>{c.name}</h3><div className="stat"><span>TOP SPEED</span><i><b style={{width:`${Math.min(100,c.speed*82+tunes[i].engine*3)}%`}}/></i></div><div className="stat"><span>HANDLING</span><i><b style={{width:`${Math.min(100,c.grip*92+tunes[i].suspension*2)}%`}}/></i></div></div><span className="select-tick">✓</span></button>)}</div><div className="garage-actions"><button className="customize-btn" onClick={()=>setCustomizing(true)}><span>⚙ CUSTOMIZE</span><b>APPEARANCE + BUILD</b></button><button className="drive-btn" onClick={()=>setView('game')}><span>DRIVE {CARS[selected].name}</span><b>ENTER CITY ↗</b></button></div></section>}
    {customizing&&<CustomizeModal car={CARS[selected]} tune={tunes[selected]} onChange={updateTune} onClose={()=>setCustomizing(false)}/>} 
    {settings&&<div className="modal-wrap" onClick={()=>setSettings(false)}><section className="settings" onClick={e=>e.stopPropagation()}><button className="modal-close" onClick={()=>setSettings(false)}>×</button><p className="eyebrow">Tune your experience</p><h2>Settings</h2><div className="setting-row"><span>Sound</span><button className={sound?'toggle on':'toggle'} onClick={()=>setSound(!sound)}><i/></button></div><div className="setting-row"><span>Graphics</span><div className="segments">{['Low','Medium','High'].map(q=><button className={quality===q?'active':''} onClick={()=>setQuality(q)} key={q}>{q}</button>)}</div></div><button className="save" onClick={()=>setSettings(false)}>Save & close</button></section></div>}
  </main>
}
