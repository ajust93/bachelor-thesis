var currentLocation =  document.documentElement.scrollTop;
var didTheBackgroundSleep = false;



chrome.runtime.onMessage.addListener(gotMessage);



async function gotMessage(message) {

  if (message === "New website visited") {
    didTheBackgroundSleep = false;
    chrome.runtime.sendMessage("Visit first link");

  } else if (message.includes("http")) {
    chrome.runtime.sendMessage("Searching HTML Element");
    var absoluteURL = message;
    var absoluteHTMLelement = document.querySelector("a[href='" + absoluteURL + "']");

    if (absoluteHTMLelement != null) {

      if (absoluteHTMLelement.hasAttribute("target")) {
        chrome.runtime.sendMessage("Link has attribute target");

      } else {
        scrollToElementAndClickIt(absoluteHTMLelement);
      }

    } else {
      var relativeURL = new URL(message).pathname;
      var relativeHTMLelement = document.querySelector("a[href='" + relativeURL + "']");

      if (relativeHTMLelement != null) {

        if (relativeHTMLelement.hasAttribute("target")) {
          chrome.runtime.sendMessage("Link has attribute target");

        } else {
          scrollToElementAndClickIt(relativeHTMLelement);
        }
  
      } else {
        chrome.runtime.sendMessage("No HTML Element found");
      }

    }

  } else if (message === "Scroll and navigate back") {
    scrollTwiceWithDelayInBetween();

    await sleep(randomizeDelay(8500));

    chrome.runtime.sendMessage("Navigated back");
    window.history.back();

  } else if (message === "Scroll last link") {
    scrollTwiceWithDelayInBetween();

    await sleep(randomizeDelay(8500));

    chrome.runtime.sendMessage("Last link scrolled");

  } else if (message === "Trying to sleep") {
    await sleep(5000);

    if (didTheBackgroundSleep === false) {
      chrome.runtime.sendMessage("Call visitURLdependentOnHTTPstatus again if setTimeout is not working");
    }
  
  } else if (message === "Sleeping worked") {
    didTheBackgroundSleep = true;
  }

}



async function scrollToElementAndClickIt(element) {
  var elementLocation = element.getBoundingClientRect().top;
  scrollSlowly(currentLocation, elementLocation);

  await sleep(randomizeDelay(4500));

  chrome.runtime.sendMessage("HTML Element clicked");
  element.click();
}



function sleep(milliseconds) {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}



async function scrollTwiceWithDelayInBetween() {
  var randomEndLocation1 = getRandomInteger(700, 900);
  var randomEndLocation2 = getRandomInteger(randomEndLocation1+500, randomEndLocation1+700);

  await sleep(randomizeDelay(2000));

  scrollSlowly(0, randomEndLocation1);

  await sleep(randomizeDelay(4000));

  scrollSlowly(randomEndLocation1, randomEndLocation2);
}



function scrollSlowly(currentLocation, endLocation) {
  var scroll = setInterval(startScrolling, 10);

  function startScrolling() {

    if (currentLocation > endLocation) {
      clearInterval(scroll);

    } else {
      var nextLocation = getRandomInteger(4, 10);
      window.scrollBy(0, nextLocation);
      currentLocation += nextLocation;
    }

  }
  
}



function randomizeDelay(delay) {
  var randomizedDelay = getRandomInteger(delay-250, delay+250);
  return randomizedDelay;
}



function getRandomInteger(min, max) {
  return Math.floor(Math.random() * (max+1 - min)) + min;
}