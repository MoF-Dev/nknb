window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'UA-85418286-4');

function loaded(){
	google.charts.load('current', {'packages':['table']});
	google.charts.setOnLoadCallback(loadRankings);
	startCountdown();
}

function startCountdown(){
	setTimeout(startCountdown, 1000);
	const target = new Date("2019-07-06T02:00:00Z").getTime(); // 9AM thailand time
	const now = new Date().getTime();
	const diff = (target-now)/1000;
	const days = Math.floor(diff/60/60/24);
	const hours = Math.floor(diff/60/60)%24;
	const mins = Math.floor(diff/60)%60;
	const secs = Math.floor(diff)%60;
	document.getElementById("countdown1").innerHTML="" + days + " days " + hours + " hours " + mins + " minutes and "+secs+" seconds";
	document.getElementById("countdown2").innerHTML=days + "D " + hours + "H " + mins + "M "+secs+"S";
}

function loadRankings(){
	const data = new google.visualization.DataTable();
	fetch("/rank.json").then(r=>r.json()).then((res)=>{
		data.addColumn('string', "Contenders");
		let latestSeason = Object.keys(res.data.seasons).sort().pop();
		let firstSeason = Object.keys(res.data.seasons).sort().shift();
		for(const sk in res.data.seasons){
			const s = res.data.seasons[sk];
			data.addColumn('number', sk+" Rankings");
			data.addColumn('number', sk+" Scores");
		}
		const rankings = res.data.rankings;
		const prevs = {};
		for(const sk of Object.keys(res.data.seasons).sort()){
			const s = res.data.seasons[sk];
			rankings.sort((u,v)=>{
				return v.scores[sk]-u.scores[sk];
			});
			let i=1;
			let incre=1;
			let lastScore=null;
			for(const e of rankings){
				if(e.rank===undefined) e.rank={};
				if(e.changes===undefined) e.changes={};
				if(e.scores[sk]!==undefined){
					e.scores[sk] = e.scores[sk]/s.votes*10;
					if(e.scores[sk]===lastScore){
						e.rank[sk]=i-1;
						incre++;
					} else {
						i+=incre;
						incre=1;
						e.rank[sk]=i-1;
						lastScore = e.scores[sk];
					}
					if(prevs[e.name]!==undefined){
						e.changes[sk] = -(e.rank[sk]-prevs[e.name]);
					}
					prevs[e.name]=e.rank[sk];
				}
			}
		}
		rankings.sort((u,v)=>{
			return u.rank[latestSeason]-v.rank[latestSeason];
		});
		console.log(rankings);
		for(const r of rankings){
			const row = [r.name];
			for(const sk in res.data.seasons){
				const rank = "<span class='summary'>" + r.rank[sk] + "</span> ";
				let changes; 
				if(r.changes[sk]!==undefined){
					let changeClass = "unchanged";
					let changeText = "-&nbsp;";
					let pre = "<span class='change hspace'>&#9650;</span>";
					if(r.changes[sk]>0){
						changeClass = "gainer";
						changeText = "&#9650; " + r.changes[sk];
						pre="";
					} else if(r.changes[sk]<0){
						changeClass="loser";
						changeText = "&#9660; " + (-r.changes[sk]);
						pre="";
					}
					changes=pre+"<span class='"+changeClass+" change'>"+changeText+"</span>";
				} else {
					changes="<span class='change hspace'>&#9650;</span><span class='unchanged change'>-&nbsp;</span>";
				}
				if(r.rank[sk]!==undefined){
					row.push({
						v: r.rank[sk],
						f: rank+changes,
					});
				} else {
					row.push({
						v: 99999,
						f: "#N/A"
					})
				}
				if(r.scores[sk]!==undefined){
					const score = r.scores[sk];
					row.push({
						v: score,
						f: "<span class='volume'>"+Math.round(score).toString()+"</span>"
					});
				} else {
					row.push({
						v: -1,
						f: "#N/A"
					});
				}
			}
			data.addRow(row);
		}

		const table = new google.visualization.Table(document.getElementById('rank_table_1'));
		table.draw(data, {
			showRowNumber: false,
			width: '100%',
			height: '100%',
			allowHtml: true,
			alternatingRowStyle: false,
			cssClassNames: {
				headerRow: "nknb-hr",
				tableRow: "nknb-tr",
				hoverTableRow: "nknb-tr-hover",
				selectedTableRow: "nknb-tr-hover",
			},
		});
	});
}