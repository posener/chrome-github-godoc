chrome.runtime.onConnect.addListener(function(port) {
	port.onMessage.addListener(function(view) {
		console.log("Processing package:", view.package);
		fetch("https://api.godoc.org/search?q=" + view.package + "/.*")
			.then(function(response) {
				if (response.status !== 200) {
					console.log("Bad status code:", response.status);
					return;
				}
				response.json().then(function(data) {
					console.log("Got response:", data);
					port.postMessage(data.results)
				});
			})
			.catch(function(err) {
				console.log("Fetch error:", err);
			});
	});
});
