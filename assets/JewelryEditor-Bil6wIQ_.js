const r=["Ranged General","Melee General","Defense General","Toughness Boost","Endurance Boost","Opportune Chance"],u=[{id:"necklace",name:"Necklace",icon:"📿",maxStats:3},{id:"ring1",name:"Ring 1",icon:"💍",maxStats:3},{id:"ring2",name:"Ring 2",icon:"💍",maxStats:3},{id:"bracelet1",name:"Left Bracelet",icon:"⌚",maxStats:3},{id:"bracelet2",name:"Right Bracelet",icon:"⌚",maxStats:3}];function h(i,t,s){t||(t={});const l=`
    <div class="jewelry-editor">
      <div class="jewelry-slots">
        ${u.map(e=>v(e,t[e.id]||[])).join("")}
      </div>
      
      <div class="jewelry-summary">
        <h3>Jewelry Stat Totals</h3>
        ${p(t)}
      </div>
    </div>
  `;i.innerHTML=l,m(i,t,s)}function v(i,t){const{id:s,name:l,icon:e,maxStats:a}=i,n=[...t];for(;n.length<a;)n.push({stat:"",value:0});return`
    <div class="jewelry-slot" data-slot="${s}">
      <div class="jewelry-slot-header">
        <span class="jewelry-icon">${e}</span>
        <span class="jewelry-name">${l}</span>
      </div>
      <div class="jewelry-stats">
        ${n.map((o,c)=>`
          <div class="jewelry-stat-row">
            <select class="jewelry-stat-select" data-slot="${s}" data-idx="${c}">
              <option value="">-- Select Stat --</option>
              ${r.map(d=>`
                <option value="${d}" ${o.stat===d?"selected":""}>${d}</option>
              `).join("")}
            </select>
            <div class="jewelry-value-input">
              <span class="prefix">+</span>
              <input type="number" 
                     class="jewelry-value" 
                     data-slot="${s}" 
                     data-idx="${c}" 
                     value="${o.value||""}" 
                     min="0" 
                     max="50"
                     placeholder="0"
                     ${o.stat?"":"disabled"}>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `}function p(i){const t={};for(const l of Object.values(i))for(const{stat:e,value:a}of l)e&&a&&(t[e]=(t[e]||0)+parseInt(a,10));const s=Object.entries(t);return s.length===0?'<p class="empty-state-sm">Add stats to your jewelry to see totals.</p>':`
    <div class="jewelry-totals-grid">
      ${s.map(([l,e])=>`
        <div class="jewelry-total-row">
          <span class="total-stat">${l}</span>
          <span class="total-value">+${e}</span>
        </div>
      `).join("")}
    </div>
  `}function m(i,t,s){i.querySelectorAll(".jewelry-stat-select").forEach(l=>{l.addEventListener("change",e=>{const a=e.target.dataset.slot,n=parseInt(e.target.dataset.idx,10),o=e.target.value;for(t[a]||(t[a]=[]);t[a].length<=n;)t[a].push({stat:"",value:0});t[a][n].stat=o;const c=i.querySelector(`.jewelry-value[data-slot="${a}"][data-idx="${n}"]`);c&&(c.disabled=!o,o||(c.value="",t[a][n].value=0)),s({...t})})}),i.querySelectorAll(".jewelry-value").forEach(l=>{l.addEventListener("change",e=>{const a=e.target.dataset.slot,n=parseInt(e.target.dataset.idx,10),o=parseInt(e.target.value,10)||0;for(t[a]||(t[a]=[]);t[a].length<=n;)t[a].push({stat:"",value:0});t[a][n].value=o,s({...t})})})}export{h as renderJewelryEditor};
//# sourceMappingURL=JewelryEditor-Bil6wIQ_.js.map
