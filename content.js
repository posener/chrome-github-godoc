
function main() {
	const project =  projectFromURL(document.location.href)
	if (project == undefined) {
		console.log("Invalid URL:", document.location.href)
		return;
	}

	console.log("starting for project: ", project);
	var port = chrome.runtime.connect({name: "fetch"});
	port.postMessage({project: project})
	port.onMessage.addListener(function(results) {
		console.log("got data: ", results);
		const lookup = mapResults(results);

		var table = document.getElementsByClassName("files")[0];
		Array.from(table.getElementsByClassName("js-navigation-item")).forEach(function(row) {
			if (!isDirectoryRow(row)) {
				return;
			}

			var name = row.getElementsByClassName("content")[0].getElementsByTagName("a")[0];
			var message = row.getElementsByClassName("message")[0];
			var synopsisBox = message.getElementsByTagName("a")[0];

			var subPackage = subPackageFromPath(name.getAttribute("href"))
			if (subPackage === undefined) {
				log.console("skipping regex mismatched:", name)
				return;
			}
			var pkg = project + "/" + subPackage;
			var entry = lookup[pkg];
			if (entry === undefined) {
				return;
			}
			var synopsis = synopsisOf(entry)
			console.log("Replacing", pkg, ":", synopsisBox.innerHTML, '->', synopsis);
			synopsisBox.innerHTML = synopsis;
			message.prepend(godocLink(entry));
		});
	});
}

const reProject = new RegExp('^https\:\/\/(github\.com\/[^/]+\/[^/]+)');

function projectFromURL(url) {
	var matches = reProject.exec(url);
	if (matches === undefined || matches.length < 2) {
		return;
	}
	return matches[1];
}

const rePath = new RegExp('^\/[^/]+\/[^/]+\/tree\/[^/]+\/(.*)');

function subPackageFromPath(path) {
	var matches = rePath.exec(path)
	if (matches === undefined || matches.length < 2) {
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
	if (entry === undefined) {
		return '';
	}
	var re = new RegExp('Package '+entry.name+' ')
	var synopsis = entry.synopsis.replace(re, '')
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

function isDirectoryRow(row) {
	if (row.classList.contains("up-tree")) {
		return false;
	}
	var tp = row.getElementsByClassName("icon")[0].getElementsByTagName("svg")[0].getAttribute("aria-label");
	return tp === "directory";
}

main();