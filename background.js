chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
	if (changeInfo.status != 'complete') {
		return;
	}
	updateGoDoc(tab);
});

function updateGoDoc(tab) {
	var view = viewFromURL(tab.url);
	if (!view) {
		return;
	}
	fetch("https://api.godoc.org/search?q=" + view.package + "/.*")
		.then(function(response) {
			if (response.status !== 200) {
				console.log("Bad status code:", response.status);
				return;
			}
			response.json().then(function(data) {
				console.log("Got response:", data);
				chrome.tabs.sendMessage(tab.id, {view: view, results: data.results});
			});
		})
		.catch(function(err) {
			console.log("Fetch error:", err);
		});
}

const reGithubPath = new RegExp('^http[s]\:\/\/(github\.com\/[^/]+\/[^/]+)(\/tree\/[^/]+(\/.*))?');

function viewFromURL(url) {
	var matches = reGithubPath.exec(url);
	if (matches == undefined || matches[1] == undefined) {
		return;
	}
	var view = {
		project: matches[1],
		package: matches[1]
	};
	if (matches[3] != undefined) {
		view.package = view.package + matches[3]
	}
	return view;
}
