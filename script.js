// Simple Expense Tracker - localStorage backed

const LS_KEY = 'expenses_v1'
let editingId = null

// elements
const txForm = document.getElementById('txForm')
const descriptionEl = document.getElementById('description')
const amountEl = document.getElementById('amount')
const categoryEl = document.getElementById('category')
const dateEl = document.getElementById('date')
const txList = document.getElementById('txList')
const balanceEl = document.getElementById('balance')
const incomeEl = document.getElementById('income')
const expensesEl = document.getElementById('expenses')
const searchEl = document.getElementById('search')
const filterCategory = document.getElementById('filterCategory')
const filterMonth = document.getElementById('filterMonth')
const exportCsvBtn = document.getElementById('exportCsv')
const resetAllBtn = document.getElementById('resetAll')
const clearBtn = document.getElementById('clearBtn')

function uid(){ return Date.now().toString(36) + Math.random().toString(36).slice(2,8) }

function loadTx(){
  try{
    const data = JSON.parse(localStorage.getItem("expenses_v1"))
    console.log(data);
    
    return Array.isArray(data) ? data : []
  }catch(e){
    console.error(e)
    return []
  }
}

function saveTx(list){
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

function render(){
  const all = loadTx()
  const q = searchEl.value.trim().toLowerCase()
  const cat = filterCategory.value
  const month = filterMonth.value // "YYYY-MM"

  let filtered = all.filter(t=>{
    if(q && !t.description.toLowerCase().includes(q)) return false
    if(cat !== 'All' && t.category !== cat) return false
    if(month){
      const mm = t.date.slice(0,7)
      if(mm !== month) return false
    }
    return true
  })

  txList.innerHTML = ''
  let total = 0, income = 0, expense = 0

  filtered.sort((a,b)=> a.date.localeCompare(b.date)).forEach(tx=>{
    const li = document.createElement('li')
    const left = document.createElement('div'); left.className='tx-left'
    const meta = document.createElement('div')
    meta.innerHTML = `<div style="font-weight:600">${tx.description}</div>
                      <div style="font-size:13px;color:rgba(255,255,255,0.5)">${tx.date} • ${tx.category}</div>`
    const badge = document.createElement('div'); badge.className='cat-badge'; badge.textContent = tx.category
    left.appendChild(badge); left.appendChild(meta)

    const right = document.createElement('div'); right.style.display='flex'; right.style.alignItems='center'
    const amt = document.createElement('div')
    amt.className = 'amount ' + (tx.amount>0 ? 'in' : 'out')
    amt.textContent = (tx.amount>0 ? '₹' : '₹-') + Math.abs(tx.amount).toFixed(2)
    right.appendChild(amt)

    const actions = document.createElement('div'); actions.className='tx-actions'
    const editBtn = document.createElement('button'); editBtn.innerText='Edit'
    editBtn.onclick = ()=> startEdit(tx.id)
    const delBtn = document.createElement('button'); delBtn.innerText='Delete'
    delBtn.onclick = ()=> removeTx(tx.id)

    actions.appendChild(editBtn); actions.appendChild(delBtn)
    right.appendChild(actions)

    li.appendChild(left); li.appendChild(right)
    txList.appendChild(li)

    total += Number(tx.amount)
    if(tx.amount>0) income += Number(tx.amount)
    else expense += Number(tx.amount)
  })

  balanceEl.textContent = `₹${total.toFixed(2)}`
  incomeEl.textContent = `₹${income.toFixed(2)}`
  expensesEl.textContent = `₹${Math.abs(expense).toFixed(2)}`
}

render()

function addTx(tx){
  const list = loadTx()
  list.push(tx)
  saveTx(list)
  render()
}

function updateTx(updated){
  let list = loadTx()
  list = list.map(t=> t.id === updated.id ? updated : t)
  saveTx(list)
  render()
}

function removeTx(id){
  if(!confirm('Delete this transaction?')) return
  let list = loadTx()
  list = list.filter(t=> t.id !== id)
  saveTx(list)
  render()
  if(editingId === id) resetForm()
}

function startEdit(id){
  const list = loadTx()
  const tx = list.find(t=> t.id === id)
  if(!tx) return
  editingId = id
  descriptionEl.value = tx.description
  amountEl.value = tx.amount
  categoryEl.value = tx.category
  dateEl.value = tx.date
  saveBtnText('Update')
}

function resetForm(){
  editingId = null
  txForm.reset()
  saveBtnText('Save')
}

function saveBtnText(txt){
  document.getElementById('saveBtn').textContent = txt
}

txForm.addEventListener('submit', e=>{
  e.preventDefault()
  const desc = descriptionEl.value.trim()
  const amount = Number(amountEl.value)
  const category = categoryEl.value
  const date = dateEl.value || new Date().toISOString().slice(0,10)

  if(!desc || isNaN(amount)){
    alert('Please enter valid description and numeric amount.')
    return
  }

  if(editingId){
    updateTx({ id: editingId, description: desc, amount, category, date })
    resetForm()
  } else {
    addTx({ id: uid(), description: desc, amount, category, date })
    resetForm()
  }
})

clearBtn.addEventListener('click', ()=> txForm.reset())

if(searchEl) searchEl.addEventListener('input', render)
if(filterCategory) filterCategory.addEventListener('change', render)
if(filterMonth) filterMonth.addEventListener('change', render)

if(exportCsvBtn) exportCsvBtn.addEventListener('click', ()=>{
  const list = loadTx()
  if(list.length === 0){ alert('No data'); return }
  const header = ['id','description','amount','category','date']
  const rows = [header.join(',')].concat(list.map(r=> [r.id, `"${r.description.replace(/"/g,'""')}"`, r.amount, r.category, r.date].join(',')))
  const csv = rows.join('\n')
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'})
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = 'expenses.csv'; a.click()
  URL.revokeObjectURL(url)
})

if(resetAllBtn) resetAllBtn.addEventListener('click', ()=>{
  if(confirm('Remove all transactions?')) {
    localStorage.removeItem(LS_KEY)
    resetForm()
    render()
    resetAllBtn.focus()
  }
})

// initial render
(function init(){
  // set today's date default
  dateEl.value = new Date().toISOString().slice(0,10)
  render()
})()

