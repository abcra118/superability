const q = "Rail Replacement";
fetch(`http://localhost:3000/api/stops?q=${encodeURIComponent(q)}`)
  .then(r => r.json())
  .then(data => {
    console.log("Results for 'Rail Replacement':");
    data.forEach(s => console.log(`- ${s.stop_name}: ${s.mode}`));
  })
  .catch(console.error);
