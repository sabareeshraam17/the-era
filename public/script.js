
const PRODUCTS=[{"id": "baggy-combo", "name": "Baggy Combo", "price": 1480, "image": "assets/combo.jpg", "tag": "BESTSELLER", "category": "Sets", "colors": [["Midnight Black", "#171717"], ["Charcoal", "#5b5b5b"]], "sizes": ["S", "M", "L", "XL"]}, {"id": "baggy-black-denim", "name": "Baggy Black Light Washed Denim", "price": 899, "image": "assets/denim.jpg", "tag": "NEW", "category": "Denim", "colors": [["Washed Black", "#1f1f20"], ["Graphite", "#4b4b4c"], ["Vintage Grey", "#777"]], "sizes": ["S", "M", "L", "XL"]}, {"id": "slim-yellow-stripe-shirt", "name": "Slim Fit Yellow Stripe Shirt", "price": 599, "image": "assets/shirt.jpg", "tag": "ESSENTIAL", "category": "Shirts", "colors": [["Butter Yellow", "#e5cf88"], ["Sky Blue", "#a8c0d8"], ["Off White", "#e9e6dc"]], "sizes": ["S", "M", "L", "XL"]}, {"id": "relaxed-oxford-shirt", "name": "Relaxed Oxford Shirt", "price": 699, "image": "assets/shirt.jpg", "tag": "SMART CASUAL", "category": "Shirts", "colors": [["Stone", "#c7c0b3"], ["Ice Blue", "#b6c8d7"], ["White", "#f3f2ed"]], "sizes": ["S", "M", "L", "XL"]}, {"id": "knit-polo", "name": "Textured Knit Polo", "price": 749, "image": "assets/shirt.jpg", "tag": "ELEVATED", "category": "Casual", "colors": [["Espresso", "#4a3228"], ["Olive", "#5c644c"], ["Cream", "#d9d0bd"]], "sizes": ["S", "M", "L", "XL"]}, {"id": "pleated-trousers", "name": "Wide-Leg Pleated Trousers", "price": 999, "image": "assets/denim-alt.jpg", "tag": "TAILORED", "category": "Bottoms", "colors": [["Black", "#171717"], ["Stone", "#b3a894"], ["Charcoal", "#505050"]], "sizes": ["S", "M", "L", "XL"]}, {"id": "boxy-tee", "name": "Heavyweight Boxy Tee", "price": 499, "image": "assets/hero.jpg", "tag": "EVERYDAY", "category": "Streetwear", "colors": [["Washed Black", "#202020"], ["Bone", "#ded7c8"], ["Burgundy", "#5f2e37"]], "sizes": ["S", "M", "L", "XL"]}, {"id": "utility-overshirt", "name": "Utility Overshirt", "price": 899, "image": "assets/combo.jpg", "tag": "LAYERING", "category": "Streetwear", "colors": [["Black", "#151515"], ["Moss", "#505742"], ["Taupe", "#9b8e78"]], "sizes": ["S", "M", "L", "XL"]}];
const CART_KEY="theEraCart",ORDER_KEY="theEraLastOrder";

function getCart(){try{return JSON.parse(localStorage.getItem(CART_KEY))||[]}catch{return[]}}
function saveCart(c){localStorage.setItem(CART_KEY,JSON.stringify(c));updateCartCount()}
function money(n){return "₹"+Number(n).toLocaleString("en-IN")}
function updateCartCount(){const n=getCart().reduce((s,i)=>s+i.qty,0);document.querySelectorAll("[data-cart-count]").forEach(e=>e.textContent=n)}
function toast(m){const t=document.querySelector(".toast");if(!t)return;t.textContent=m;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}

function selectedVariant(id){
  const card=document.querySelector(`[data-product-id="${id}"]`);
  if(!card)return {size:"M",color:PRODUCTS.find(p=>p.id===id)?.colors?.[0]?.[0]||"Default"};
  const size=card.querySelector(".size-option.selected")?.dataset.size || card.querySelector(".size-option")?.dataset.size || "M";
  const color=card.querySelector(".color-option.selected")?.dataset.color || card.querySelector(".color-option")?.dataset.color || PRODUCTS.find(p=>p.id===id)?.colors?.[0]?.[0] || "Default";
  return {size,color};
}
function chooseSize(btn){const wrap=btn.closest(".size-row");wrap.querySelectorAll(".size-option").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected")}
function chooseColor(btn){const wrap=btn.closest(".color-row");wrap.querySelectorAll(".color-option").forEach(x=>x.classList.remove("selected"));btn.classList.add("selected")}

function addToCart(id){
  const p=PRODUCTS.find(x=>x.id===id); if(!p)return;
  const v=selectedVariant(id);
  const c=getCart();
  const existing=c.find(x=>x.id===id&&x.size===v.size&&x.color===v.color);
  if(existing) existing.qty++;
  else c.push({id,qty:1,size:v.size,color:v.color});
  saveCart(c); toast(`${p.name} · ${v.size} · ${v.color} added`);
}

function removeFromCart(id,size,color){
  saveCart(getCart().filter(i=>!(i.id===id&&i.size===size&&i.color===color)));
  renderOrderSummary();
}
function changeQty(id,size,color,d){
  const c=getCart(),i=c.find(x=>x.id===id&&x.size===size&&x.color===color);if(!i)return;
  i.qty+=d;if(i.qty<=0)return removeFromCart(id,size,color);
  saveCart(c);renderOrderSummary();
}

function productCard(p){
  const firstColor=p.colors?.[0];
  return `<article class="card" data-product-id="${p.id}" data-category="${p.category}">
    <div class="card-image"><img src="${p.image}" alt="${p.name}"></div>
    <div class="card-body">
      <span class="tag">${p.tag}</span>
      <div class="card-title">${p.name}</div>
      <div class="card-meta">${p.category}</div>
      <div class="card-price">${money(p.price)}</div>

      <div class="variant-label">Colour <span>${firstColor?firstColor[0]:"Default"}</span></div>
      <div class="color-row">
        ${p.colors.map((c,i)=>`<button type="button" class="color-option ${i===0?"selected":""}" data-color="${c[0]}" title="${c[0]}" style="--swatch:${c[1]}" onclick="chooseColor(this)"></button>`).join("")}
      </div>

      <div class="variant-label">Size</div>
      <div class="size-row">
        ${p.sizes.map(s=>`<button type="button" class="size-option ${s==="M"?"selected":""}" data-size="${s}" onclick="chooseSize(this)">${s}</button>`).join("")}
      </div>

      <div class="card-actions"><button class="btn full" onclick="addToCart('${p.id}')">Add to cart</button></div>
    </div>
  </article>`;
}

function renderProducts(){
  const g=document.querySelector("[data-products]");if(!g)return;
  g.innerHTML=PRODUCTS.map(productCard).join("");
}
function filterProducts(category){
  document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b.dataset.filter===category));
  document.querySelectorAll(".card[data-category]").forEach(c=>c.style.display=(category==="All"||c.dataset.category===category)?"":"none");
}
function renderOrderSummary(){
  const b=document.querySelector("[data-summary]");if(!b)return;
  const c=getCart();
  if(!c.length){b.innerHTML='<div class="empty">Your cart is empty.<br><br><a class="btn alt" href="index.html#shop">Shop collection</a></div>';return}
  let total=0;
  b.innerHTML=c.map(i=>{
    const p=PRODUCTS.find(x=>x.id===i.id);if(!p)return "";
    total+=p.price*i.qty;
    return `<div class="summary-item"><img src="${p.image}" alt="">
      <div class="summary-info"><strong>${p.name}</strong>
      <span>${money(p.price)} × ${i.qty}</span>
      <span>Size: ${i.size} · Colour: ${i.color}</span>
      <div style="display:flex;gap:6px;margin-top:8px">
        <button class="btn alt" style="padding:5px 9px" onclick="changeQty('${p.id}','${i.size}','${i.color}',-1)">−</button>
        <button class="btn alt" style="padding:5px 9px" onclick="changeQty('${p.id}','${i.size}','${i.color}',1)">+</button>
        <button class="btn alt" style="padding:5px 9px" onclick="removeFromCart('${p.id}','${i.size}','${i.color}')">Remove</button>
      </div></div></div>`;
  }).join("")+`<div class="total"><span>Total</span><span>${money(total)}</span></div>`;
}

async function submitOrder(e){
  e.preventDefault();
  const c=getCart();
  if(!c.length){toast("Add a product first");return}
  const f=e.target;
  if(!f.checkValidity()){f.reportValidity();return}
  const method=f.querySelector('input[name="payment"]:checked')?.value;
  const data=Object.fromEntries(new FormData(f).entries());
  if(method==="upi"&&!data.upiId){document.querySelector("#upiId").focus();toast("Enter your UPI ID");return}
  const payload={customer:{name:data.name,phone:data.phone,email:data.email,address:data.address,city:data.city,pin:data.pin},payment:method,upiId:data.upiId||"",items:c.map(i=>({id:i.id,qty:i.qty,size:i.size,color:i.color}))};
  try{
    const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const out=await res.json();if(!res.ok)throw new Error(out.error||"Unable to place order");
    localStorage.setItem(ORDER_KEY,JSON.stringify(out.order));localStorage.removeItem(CART_KEY);location.href="success.html";
  }catch(err){toast(err.message)}
}

async function loadSuccess(){
  const o=document.querySelector("[data-success]");if(!o)return;
  const local=JSON.parse(localStorage.getItem(ORDER_KEY)||"null");
  if(!local){o.innerHTML='<div class="empty">No recent order found.</div>';return}
  const names=(local.items||[]).map(i=>`${PRODUCTS.find(x=>x.id===i.id)?.name||"Item"} × ${i.qty} · ${i.size} · ${i.color}`).join(", ");
  o.innerHTML=`<div class="success"><div class="success-mark">✓</div><div class="kicker">ORDER CONFIRMED</div><h1 class="page-title">Thank you.</h1><p>Your order has been placed successfully. Your order is now visible to THE ERA owner for processing.</p><div class="order-id">${local.orderId}</div><div class="panel" style="text-align:left"><strong>Items</strong><p style="color:#666;margin:7px 0 18px">${names}</p><div class="total"><span>Total</span><span>${money(local.total)}</span></div><div class="notice"><strong>Payment:</strong> ${local.payment==="cod"?"Cash on Delivery":"UPI"}</div></div><br><div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap"><a class="btn" href="my-orders.html">Track my order</a><a class="btn alt" href="index.html">Continue shopping</a></div></div>`
}

document.addEventListener("DOMContentLoaded",()=>{
  updateCartCount();renderProducts();renderOrderSummary();loadSuccess();
  document.querySelectorAll('input[name="payment"]').forEach(r=>r.addEventListener("change",()=>{const wrap=document.querySelector("[data-upi-wrap]");if(wrap)wrap.style.display=r.value==="upi"&&r.checked?"block":"none"}));
  const f=document.querySelector("[data-order-form]");if(f)f.addEventListener("submit",submitOrder);
});
