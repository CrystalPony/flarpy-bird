const arweave = Arweave.init();

const tipAddress = 'welkszrGJ1Lox9JKWS0s0E38e_iZwYfSdgAvCbZ4SqI';

var scoreSubmitCallback;
var fileSelected = false;
var arweaveInitialized = false;
var tipFee = 0;

document.querySelector("#tip").addEventListener("keyup", event => {
    if(event.key !== "Enter") return;
    document.querySelector("#tip-button").click();
    event.preventDefault();
});
document.querySelector("#tip").addEventListener('input', onTipChanged);

arweave.network.getInfo().then((result) => {
	arweaveInitialized = true;
	console.log(result);
});

getTipFee();

async function getTipFee() {
	tipFee = await arweave.transactions.getPrice(0, tipAddress)
	updateTipFullAmount();
}

function onTipChanged() {
	updateTipFullAmount();
}

function updateTipFullAmount() {
	const value = document.getElementById("tip").value;
	document.getElementById("tip-amount").innerHTML = `~${parseFloat(value) + parseFloat(arweave.ar.winstonToAr(tipFee))} AR including fee`;
}

function submitScore(score, position, callback) {
	scoreSubmitCallback = callback;
	let input = document.getElementById("input");
	if (input == null) {
		input = document.createElement("input");
		input.setAttribute("id", "input");
		input.setAttribute("type", "file");
		
		input.onchange = function(e) { 
			let files = e.target.files;
			let upfile = new FileReader()
			upfile.onload = function (ev) {
				fileSelected = true;
				try {
					let wallet = JSON.parse(ev.target.result);			
					sendScoreTransaction(wallet, score, position);
				} catch (err) {
					alert("Please upload your wallet file to submit the score.");
					scoreSubmitCallback(false);
				}
			}
			upfile.readAsText(files[0])
		};
	}
	
	document.onmousemove = function(e) {
		if (fileSelected) {
			fileSelected = false;
		} else {
			scoreSubmitCallback(false);
		}
		document.onmousemove = null;
	}
	
	input.click();
}

async function sendScoreTransaction(wallet, score, position) {
	const address = await arweave.wallets.jwkToAddress(wallet)
	let balance = await arweave.wallets.getBalance(address)
	const winston = balance;
	let fee = await fetch('https://arweave.net/price/20/'+address)
	fee = await fee.text();
	fee = arweave.ar.winstonToAr(fee);
	balance = arweave.ar.winstonToAr(winston);
	
	if (balance < fee) {
		alert(`Insufficient funds to pay the fee (${fee})`);
	} else {
		try {
			let transaction = await arweave.createTransaction({
					data: `{"score":"${score.toString()}","pos":"${position.toString()}"}`
				}, wallet);
			transaction.addTag('Content-Type', 'text/plain');
			transaction.addTag('Applications-Name', 'flARpy bird');
			transaction.addTag('Data-Type', 'Score');
					
			await arweave.transactions.sign(transaction, wallet);
			
			console.log(transaction);
			
			const response = await arweave.transactions.post(transaction)
			if (response.status === 200) {
				alert("You score has been submitted! It will appear as soon as the transaction gets mined.");
				scoreSubmitCallback(true);
				return;
			}
		} catch (e) {
			console.log(e);
			alert("Failed to submit the transaction.");
		}
	}			
	scoreSubmitCallback(false);	
}

async function sendTipTransaction(wallet, amount) {
	alert("Sending...");
	
	const address = await arweave.wallets.jwkToAddress(wallet)
	let balance = await arweave.wallets.getBalance(address)
	const winston = balance;
	balance = arweave.ar.winstonToAr(winston);
	
	if (balance < amount + arweave.ar.winstonToAr(tipFee)) {
		alert(`Insufficient funds`);
	} else {
		try {
			let transaction = await arweave.createTransaction({
					target: tipAddress,
					quantity: arweave.ar.arToWinston(amount)
				}, wallet);
					
			await arweave.transactions.sign(transaction, wallet);
			
			console.log(transaction);
			
			const response = await arweave.transactions.post(transaction)
			if (response.status === 200) {
				alert(`Thanks! :)\n${transaction.id}`);
				return;
			}
		} catch (e) {
			console.log(e);
			alert("Failed to submit the transaction.");
		}
	}			
}

async function getHighScores() {
	//await until(_ => arweaveInitialized == true);
	
	const txids = await arweave.arql({
		op: "and",
		expr1: {
			op: "equals",
			expr1: "Applications-Name",
			expr2: "flARpy bird"
		},
		expr2: {
			op: "equals",
			expr1: "Data-Type",
			expr2: "Score"
		}
	})
	let jsondata = [];
	
	for (let i = 0; i < txids.length; i++) {
		try
		{
			let transaction = await arweave.transactions.get(txids[i]);
			let data = transaction.get('data', { decode: true, string: true })
			let address = await arweave.wallets.ownerToAddress(transaction.owner)
			let dataJson = JSON.parse(data);
			
			if (dataJson.pos) {
				jsonStr = `{"id":"${address}", "score":"${dataJson.score}", "position":"${dataJson.pos}"}`;
			} else {
				jsonStr = `{"id":"${address}", "score":"${data}"}`;
			}
			
			let json = JSON.parse(jsonStr);
			jsondata.push(json);
		} catch(e) { 
			console.log(e);
			console.log(txids);
		} 
	}
	
	jsondata.sort(function (a, b) {
		return b.score - a.score;
	});

	return jsondata;
}

function openTipFile() {
	const amount = parseFloat(document.getElementById("tip").value);
	if (amount != NaN && amount > 0) {
		document.getElementById("tip-file").click();
	}
}

function tip(event) {
	let files = event.target.files;
	let upfile = new FileReader()
	upfile.onload = function (ev) {
		try {
			let wallet = JSON.parse(ev.target.result);			
			sendTipTransaction(wallet, parseFloat(document.getElementById("tip").value));
		} catch (err) {
			alert("Please upload your wallet file if you want to send a tip.");
		}
	}

	upfile.readAsText(files[0])
}

function until(conditionFunction) {

	const poll = resolve => {
		if(conditionFunction()) resolve();
		else setTimeout(_ => poll(resolve), 400);
	}

	return new Promise(poll);
}