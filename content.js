
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
	var view = request.view;
	var results = request.results;
	console.log("starting for view: ", view);
	const lookup = mapResults(results);

	updateHeader(view, lookup)
	updateFilesList(view, lookup)
})

function updateHeader(view, lookup) {
	const entry = lookup[view.package]
	if (entry == undefined || entry.synopsis == undefined) {
		return;
	}
	console.log('Update header with package synopsis.')
	var header = document.getElementsByClassName("commit-tease")[0];
	while (header.firstChild) {
		header.removeChild(header.firstChild);
	}
	header.appendChild(godocText(entry))
}

function updateFilesList(view, lookup) {
	var table = document.getElementsByClassName("files")[0];
	Array.from(table.getElementsByClassName("js-navigation-item")).forEach(function(row) {
		if (!isDirectoryRow(row)) {
			return;
		}

		var name = row.getElementsByClassName("content")[0].getElementsByTagName("a")[0];
		var message = row.getElementsByClassName("message")[0];
		var synopsisBox = message.getElementsByTagName("a")[0];

		var subPackage = subPackageFromPath(name.getAttribute("href"));
		if (subPackage == undefined) {
			log.console("skipping regex mismatched:", name);
			return;
		}
		var pkg = view.project + "/" + subPackage;
		var entry = lookup[pkg];
		if (entry == undefined || entry.synopsis == undefined) {
			return;
		}
		var synopsis = synopsisOf(entry);
		console.log("Replacing", pkg, ":", synopsisBox.innerHTML, '->', synopsis);
		synopsisBox.innerHTML = synopsis;
		message.prepend(godocLink(entry));
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

const rePath = new RegExp('^\/[^/]+\/[^/]+\/tree\/[^/]+\/(.*)');

function subPackageFromPath(path) {
	var matches = rePath.exec(path);
	if (matches == undefined || matches.length < 2) {
		return;
	}
	return matches[1];
}

// Transform the results by their path.
function mapResults(results) {
	return results.reduce(function(map, result) {
		map[result.path] = result;
		return map;
	}, {});
}

function synopsisOf(entry) {
	var re = new RegExp('Package '+entry.name+' ');
	var synopsis = entry.synopsis.replace(re, '');
	return synopsis.charAt(0).toUpperCase() + synopsis.slice(1);
}

function godocLink(entry) {
	var a = document.createElement("a");
	a.setAttribute("href", "https://godoc.org/" + entry.path);
	a.setAttribute("target", "_blank");
	img = document.createElement("img");
	img.setAttribute("src", chrome.runtime.getURL("images/gopher.png"));
	img.setAttribute("height", "16")
	img.setAttribute("width", "16")
	a.appendChild(img);
	return a;
}

function godocText(entry) {
	var a = document.createElement("a");
	a.setAttribute("href", "https://godoc.org/" + entry.path);
	a.setAttribute("target", "_blank");
	a.innerHTML = synopsisOf(entry);
	return a;
}

function isDirectoryRow(row) {
	if (row.classList.contains("up-tree")) {
		return false;
	}
	var tp = row.getElementsByClassName("icon")[0].getElementsByTagName("svg")[0].getAttribute("aria-label");
	return tp === "directory";
}