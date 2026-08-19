async function check() {
  const res = await fetch('https://saavn.sumit.co/api/search/songs?query=telugu');
  const data = await res.json();
  const results = data.data.results || data.data;
  console.log(JSON.stringify(results[0].downloadUrl, null, 2));
}
check();
