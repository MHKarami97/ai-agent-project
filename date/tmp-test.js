const div=Math.floor;
const jalaliToJdn=(jy,jm,jd)=>{jy=+jy;jm=+jm;jd=+jd;const epbase=jy-(jy>=0?474:473);const epyear=474+Math.floor(epbase/2820);return jd+(jm<=7?(jm-1)*31:(jm-7)*30+186)+Math.floor((epyear*682-110)/2816)+(epyear-1)*365+Math.floor(epbase/2820)*1029983+1948320-1;};
const jdnToGregorian=(jdn)=>{let a=jdn+32044;let b=Math.floor((4*a+3)/146097);let c=a-Math.floor(146097*b/4);let d=Math.floor((4*c+3)/1461);let e=c-Math.floor(1461*d/4);let m=Math.floor((5*e+2)/153);let day=e-Math.floor((153*m+2)/5)+1;let month=m+3-12*Math.floor(m/10);let year=100*b+d-4800+Math.floor(m/10);return {gy:year,gm:month,gd:day};};
const jdn=jalaliToJdn(1376,8,7);
console.log({jdn,jgreg:jdnToGregorian(jdn)});

