const q = "Melbourne";
fetch(`http://localhost:3000/api/stops?q=${q}`)
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
