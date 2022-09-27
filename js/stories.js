"use strict";

// This is the global list of the stories, an instance of StoryList
let storyList;

/** Get and show stories when site first loads. */

async function getAndShowStoriesOnStart() {
  storyList = await StoryList.getStories();
  $storiesLoadingMsg.remove();

  putStoriesOnPage();
}

/**
 * A render method to render HTML for an individual Story instance
 * - story: an instance of Story
 *
 * Returns the markup for the story.
 */

function generateStoryMarkup(story) {
  // console.debug("generateStoryMarkup", story);

  const hostName = story.getHostName();
  //Allows UI to be different if logged in
  let favHtml = "";
  let removeHtml = "";
  if (currentUser) {
    const favorited = currentUser.isFavorite(story.storyId) ? "&starf;" : "&star;";
    favHtml = `<span class="story-favorite">${favorited}</span>`
    removeHtml = `<button class="story-remove">Remove</button>`
  }
  return $(`
      <li id="${story.storyId}">
        ${favHtml}
        <a href="${story.url}" target="a_blank" class="story-link">
          ${story.title}
        </a>
        <small class="story-hostname">(${hostName})</small>
        <small class="story-author">by ${story.author}</small>${removeHtml}
        <small class="story-user">posted by ${story.username}</small>
      </li>
    `);
}

/** Gets list of stories from server, generates their HTML, and puts on page. */

function putStoriesOnPage() {
  console.debug("putStoriesOnPage");

  $allStoriesList.empty();

  //Loop through all of our stories and generate HTML for them
  for (let story of storyList.stories) {
    const $story = generateStoryMarkup(story);
    $allStoriesList.append($story);
  }

  $allStoriesList.show();
}

//Sends storydata to api and updates page with stories
async function storySubmission(evt) {
  evt.preventDefault();

  let storyData = {
    author: $("#author-input").val(),
    title: $("#title-input").val(),
    url: $("#url-input").val()
  }

  let story = await storyList.addStory(currentUser, storyData);
  const $story = generateStoryMarkup(story);
  $allStoriesList.prepend($story);
  $storyForm[0].reset();
}

$storySubmit.on("click", storySubmission);

$allStoriesList.on("click", ".story-favorite", function (evt) {
  let storyId = evt.target.parentElement.id;
  if (currentUser.isFavorite(storyId)) {
    currentUser.removeFavorite(storyId);
    evt.target.innerHTML = "&star;"
  }
  else {
    currentUser.addFavorite(storyId);
    evt.target.innerHTML = "&starf;"
  }
});

$allStoriesList.on("click", ".story-remove", async function (evt) {
  let storyId = evt.target.parentElement.id;
  let res = await currentUser.removeStory(storyId);
  if (res.status === 200) {
    evt.target.parentElement.remove();
  }
})

$navFavorites.on("click", function(){
  hidePageComponents();
  currentUser.putFavoritesOnPage();
});

$navOwn.on("click", function(){
  hidePageComponents();
  currentUser.putOwnOnPage();
});