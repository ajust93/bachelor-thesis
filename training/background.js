const startDate = new Date(2020, 7, 28); // (Year, Month, Day)  0 = January   11 = December
const profileID = 1; // 1-4 Poor    5-8 Rich    9-12 Male   13-16 Female
const api = "removed"; // api url removed

var startTime = Date.now();
var dayDifference = getDayDifference();

var allWebsitesForCurrentTraining = [];
var websitesWithoutFlagForCurrentTraining = [];

var flaggedWebsitesFromDB = [];
var flaggedLinksFromDB = [];

var clonedMapWithoutFlags = new Map(websiteToLinksMapping);

var currentWebsite = "";
var nextWebsite = "";
var currentURL = ""; // Can be a website or a link

var wasNewWebsiteVisited = true;
var didTheSleepingWork = false; // For one function setTimeout() sometimes does not start [Might be fixed now with persistent background]
var HTTPstatus = []; // Workaround for problematic use of Promises: Array instead of String

var numberOfWebsitesToVisit = 0;
var numberOfVisitedWebsites = 0;
var numberOfCheckedWebsites = 0;

var numberOfLinksToVisitForCurrentWebsite = 0;
var numberOfVisitedLinksForCurrentWebsite = 0;
var numberOfCheckedLinksForCurrentWebsite = 0;

var numberOfVisitedLinksForAllWebsites = 0;
var numberOfCheckedLinksForAllWebsites = 0;

var flaggedWebsitesDuringTraining = [];
var flaggedLinksDuringTraining = [];



chrome.windows.onCreated.addListener(chromeStarted);
chrome.webNavigation.onCompleted.addListener(websiteLoaded);
chrome.runtime.onMessage.addListener(gotMessage);



async function chromeStarted(message) {

  setTimeout(function() {
    closeChromeBrowser();
  }, 2400000); // 40 minutes (= 2400000 milliseconds)

  sendLogToAPI("Training");
  sendLogToAPI("Debug");
  allWebsitesForCurrentTraining = getWebsitesForTraining();

  if (allWebsitesForCurrentTraining.length > 0) {
    sendQueryToAPI("type=checkwebsiteflags&websites=" + allWebsitesForCurrentTraining, "Websites");

    await sleep(randomizeDelay(3000));

    removeFlaggedWebsitesFromTraining();
    numberOfWebsitesToVisit = websitesWithoutFlagForCurrentTraining.length;
    sendQueryToAPI("type=checklinkflags&links=" + websitesWithoutFlagForCurrentTraining, "Links");

    await sleep(randomizeDelay(3000));

    removeFlaggedLinksFromTraining();

    visitNextWebsite();

  }

}



async function sendLogToAPI(mode = "") {
  var dateTime = getDateTime();
  var timeSpentForTraining = calculateTimeSpentForTraining();

  await sleep(randomizeDelay(1000));

  if (mode === "Training") {
    sendQueryToAPI(
      "type=traininglog&profile_id=" + profileID + "&day_difference=" + dayDifference + "&date_time=" + dateTime +
      "&time_spent=" + timeSpentForTraining + "&websites_visited=" + numberOfVisitedWebsites +
      "&websites_checked=" + numberOfCheckedWebsites + "&links_visited=" + numberOfVisitedLinksForAllWebsites +
      "&links_checked=" + numberOfCheckedLinksForAllWebsites + "&flagged_websites=" + flaggedWebsitesDuringTraining.toString() +
      "&flagged_links=" + flaggedLinksDuringTraining.toString()
    );

  } else if (mode === "Debug") {
    sendQueryToAPI(
      "type=debuglog&profile_id=" + profileID + "&day_difference=" + dayDifference + "&date_time=" + dateTime +
      "&time_spent=" + timeSpentForTraining + "&last_link=" + encodeURIComponent(currentURL) +
      "&websites_visited=" + numberOfVisitedWebsites + "&websites_checked=" + numberOfCheckedWebsites +
      "&links_visited=" + numberOfVisitedLinksForAllWebsites + "&links_checked=" + numberOfCheckedLinksForAllWebsites +
      "&flagged_websites=" + flaggedWebsitesDuringTraining.toString() + "&flagged_links=" + flaggedLinksDuringTraining.toString()
    );

  }

}



function getDateTime() {
  var date = new Date(); // Example: Mon Aug 03 2020 12:28:41 GMT+0200 (Mitteleuropäische Sommerzeit)
  var dateAsString = date.toString();
  var index = dateAsString.indexOf("GMT");
  var sliced = dateAsString.slice(0, index-1); // Example: Mon Aug 03 2020 12:28:41
  return sliced;
}



function calculateTimeSpentForTraining() {
  var endTime = Date.now();
  var difference = endTime - startTime;
  var differenceInMinutes = (difference / 60000).toFixed(2).toString();
  var split = differenceInMinutes.split(".");
  var minutes = split[0];
  var seconds = 60 * (split[1] / 100);
  return (minutes + "m" + seconds.toFixed(0) + "s"); // Example: "1m23s" instead of "1.38"
}



function sendQueryToAPI(message, mode = "") {
  request = new XMLHttpRequest();
  request.open("POST", api, true);
  request.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
  request.send(message);

  request.onreadystatechange = function () {

    if (request.readyState === XMLHttpRequest.DONE) {

      if (request.status === 200) {

        if (request.responseText.length > 0) {

        } if (mode === "Websites") {
          flaggedWebsitesFromDB = request.responseText.split(",");

        } else if (mode === "Links") {
          flaggedLinksFromDB = request.responseText.split(",");
        }

      }

    }

  };

}



function getDayDifference() {
  var currentDate = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());
  var difference = parseInt((currentDate - startDate) / (1000 * 60 * 60 * 24), 10);
  return difference;
}



function getWebsitesForTraining() {

  if (dayDifference > 13) { // Training from day 0-13
    return []; // Plugin for price check is running (day 14+)
  }

  const currentHour = new Date().getHours();
  var mapKey;

  if (6 <= currentHour && currentHour <= 10) {
    mapKey = dayDifference + "-morning";

  } else if (11 <= currentHour && currentHour <= 17) {
    mapKey = dayDifference + "-afternoon";

  } else if (18 <= currentHour && currentHour <= 23) {
    mapKey = dayDifference + "-evening";
  }

  var websites = [];

  if (profileID === 1 || profileID === 2 || profileID === 3 || profileID === 4) {
    websites = sessionToWebsitesMappingPoor.get(mapKey);

  } else if (profileID === 5 || profileID === 6 || profileID === 7 || profileID === 8) {
    websites = sessionToWebsitesMappingRich.get(mapKey);

  } else if (profileID === 9 || profileID === 10 || profileID === 11 || profileID === 12) {
    websites = sessionToWebsitesMappingMale.get(mapKey);

  } else if (profileID === 13 || profileID === 14 || profileID === 15 || profileID === 16) {
    websites = sessionToWebsitesMappingFemale.get(mapKey);
  }

  return websites;
}



function removeFlaggedWebsitesFromTraining() {

  for (website of allWebsitesForCurrentTraining) {

    if (!flaggedWebsitesFromDB.includes(website)) {
      websitesWithoutFlagForCurrentTraining.push(website);
    }

  }

}



function removeFlaggedLinksFromTraining() {

  for (website of websitesWithoutFlagForCurrentTraining) {
    var links = clonedMapWithoutFlags.get(website);

    for (flaggedLink of flaggedLinksFromDB) {

      if (links.includes(flaggedLink)) {
        var index = links.indexOf(flaggedLink);
        links.splice(index, 1);
      }

    }

  }

}



async function closeChromeBrowser() {
  sendLogToAPI("Training");

  await sleep(randomizeDelay(4000));

  closeAllTabs();
}



async function visitNextWebsite() {
  numberOfVisitedLinksForCurrentWebsite = 0;
  numberOfCheckedLinksForCurrentWebsite = 0;

  await sleep(randomizeDelay(4000));

  continueTrainingOrStopIfDone();
}



function continueTrainingOrStopIfDone() {

  if (numberOfCheckedWebsites < numberOfWebsitesToVisit) {
    nextWebsite = websitesWithoutFlagForCurrentTraining[numberOfCheckedWebsites];
    currentWebsite = nextWebsite;
    numberOfLinksToVisitForCurrentWebsite = clonedMapWithoutFlags.get(currentWebsite).length;
    visitURLdependentOnHTTPstatus(nextWebsite, "Website");

  } else {
    closeChromeBrowser();
  }

}



function sleep(milliseconds) {
 return new Promise(resolve => setTimeout(resolve, milliseconds));
}



async function visitURLdependentOnHTTPstatus(url, mode = "") {

  if (mode === "Website" && didTheSleepingWork === false) {
    sendMessageToContentScript("Trying to sleep");
  }

  getHTTPstatus(url);

  if (didTheSleepingWork === false) {
    await sleep(randomizeDelay(2000));

    sendLogToAPI("Debug");
    var status = HTTPstatus[0];

    if (mode === "Website") {
      sendMessageToContentScript("Sleeping worked");
      didTheSleepingWork = true;
      numberOfCheckedWebsites++;

      if (status < 400) {
        wasNewWebsiteVisited = true;
        numberOfVisitedWebsites++;
        chrome.tabs.update({ url: url });

      } else {
        flaggedWebsitesDuringTraining.push(url + " " + status);
        sendQueryToAPI("type=flagchange&website=" + encodeURIComponent(url) + "&httpstatus=" + status);
        visitNextWebsite();
      }

    } else if (mode === "Link") {

      if (status < 400) {
        sendMessageToContentScript(url);

      } else {
        numberOfCheckedLinksForCurrentWebsite++;
        numberOfCheckedLinksForAllWebsites++;
        flaggedLinksDuringTraining.push(url + " " + status);
        sendQueryToAPI("type=flagchange&link=" + encodeURIComponent(url) + "&httpstatus=" + status);
        visitNextLinkOrWebsite();
      }

    }
  }
}



function getHTTPstatus(url) {

  var request = new Request(url);

  fetch(request).then(function (response) {
    HTTPstatus[0] = response.status;
  });

}



function sendMessageToContentScript(message) {

  chrome.tabs.query({"currentWindow": true}, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });

}



function closeAllTabs() {

  chrome.tabs.query({}, function (tabs) {
  
    tabs.forEach(tab => {
      chrome.tabs.remove(tab.id, function() { });
  
    });

  });

}



function visitNextLinkOrWebsite() {

  if (numberOfLinksToVisitForCurrentWebsite > numberOfCheckedLinksForCurrentWebsite) {
    sendNextLinkToContentScript(500);

  } else {
    visitNextWebsite();
  }

}



async function sendNextLinkToContentScript(delay) {
  await sleep(randomizeDelay(delay));

  var nextLink = clonedMapWithoutFlags.get(currentWebsite)[numberOfCheckedLinksForCurrentWebsite];
  visitURLdependentOnHTTPstatus(nextLink, mode = "Link");
}



function randomizeDelay(delay) {
  var randomizedDelay = getRandomInteger(delay-250, delay+250);
  return randomizedDelay;
}



function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}



async function websiteLoaded(message) {
  if (dayDifference <= 13) {

    await sleep(randomizeDelay(5000)); // Fix for 'Disable developer mode extensions' Chrome popup at the beginning

    if (wasNewWebsiteVisited == true) { // Without this check visited links would also send the message
      wasNewWebsiteVisited = false;
      didTheSleepingWork = false;
      sendMessageToContentScript("New website visited");
    }

  } else { // Plugin for price check is running (day 14+)
    
    chrome.tabs.query({"currentWindow": true}, function(tabs) {
      currentURL = tabs[0].url;
    });

    sendLogToAPI("Debug");
  }

}



async function gotMessage(message) {

  if (message === "Visit first link") {
    var link = clonedMapWithoutFlags.get(currentWebsite)[0];
    visitURLdependentOnHTTPstatus(link, mode = "Link");

  } else if (message === "Searching HTML Element") {
    numberOfCheckedLinksForCurrentWebsite++;
    numberOfCheckedLinksForAllWebsites++;

  } else if (message === "HTML Element clicked") {
    var link = clonedMapWithoutFlags.get(currentWebsite)[numberOfCheckedLinksForCurrentWebsite-1];

    await sleep(randomizeDelay(4500));
    
    chrome.tabs.query({"currentWindow": true}, function(tabs) {
      currentURL = tabs[0].url;
    });

    await sleep(randomizeDelay(2000));

    if (currentWebsite != currentURL) {
      numberOfVisitedLinksForCurrentWebsite++;
      numberOfVisitedLinksForAllWebsites++;

      if (numberOfCheckedLinksForCurrentWebsite >= numberOfLinksToVisitForCurrentWebsite) {
        sendMessageToContentScript("Scroll last link");

      } else {
        sendMessageToContentScript("Scroll and navigate back");
      }

    } else {
      var link = clonedMapWithoutFlags.get(currentWebsite)[numberOfCheckedLinksForCurrentWebsite-1];
      flaggedLinksDuringTraining.push(link + " -01");
      sendQueryToAPI("type=flagchange&link=" + encodeURIComponent(link) + "&httpstatus=-01"); // Click had no effect (= link did not open)
      visitNextLinkOrWebsite();
    }

  } else if (message === "No HTML Element found") {
    var link = clonedMapWithoutFlags.get(currentWebsite)[numberOfCheckedLinksForCurrentWebsite-1];
    flaggedLinksDuringTraining.push(link + " -02");
    sendQueryToAPI("type=flagchange&link=" + encodeURIComponent(link) + "&httpstatus=-02");
    visitNextLinkOrWebsite();

  } else if (message === "Link has attribute target") {
    var link = clonedMapWithoutFlags.get(currentWebsite)[numberOfCheckedLinksForCurrentWebsite-1];
    flaggedLinksDuringTraining.push(link + " -03");
    sendQueryToAPI("type=flagchange&link=" + encodeURIComponent(link) + "&httpstatus=-03");
    visitNextLinkOrWebsite();

  } else if (message === "Navigated back") {
    sendNextLinkToContentScript(3000);

  } else if (message === "Last link scrolled") {
    visitNextWebsite();
  
  } else if (message === "Call visitURLdependentOnHTTPstatus again if setTimeout is not working") {

    if (didTheSleepingWork === false) {
      visitURLdependentOnHTTPstatus(nextWebsite, "Website");
    }

  }

}
