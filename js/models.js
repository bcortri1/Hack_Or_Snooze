"use strict";

const BASE_URL = "https://hack-or-snooze-v3.herokuapp.com";

/******************************************************************************
 * Story: a single story in the system
 */

class Story {

  /** Make instance of Story from data object about story:
   *   - {title, author, url, username, storyId, createdAt}
   */

  constructor({ storyId, title, author, url, username, createdAt }) {
    this.storyId = storyId;
    this.title = title;
    this.author = author;
    this.url = url;
    this.username = username;
    this.createdAt = createdAt;
  }

  /** Parses hostname out of URL and returns it. */

  getHostName() {
    //Url object already implements wanted functionality
    const url = new URL(this.url)

    return url.hostname;
  }
}


/******************************************************************************
 * List of Story instances: used by UI to show story lists in DOM.
 */

class StoryList {
  constructor(stories) {
    this.stories = stories;
  }

  /** Generate a new StoryList. It:
   *
   *  - calls the API
   *  - builds an array of Story instances
   *  - makes a single StoryList instance out of that
   *  - returns the StoryList instance.
   */

  static async getStories() {
    // Note presence of `static` keyword: this indicates that getStories is
    //  **not** an instance method. Rather, it is a method that is called on the
    //  class directly. Why doesn't it make sense for getStories to be an
    //  instance method?
    //It returns a new StoryList, which would require a StoryList already to have been made to call this function

    // query the /stories endpoint (no auth required)
    const response = await axios({
      url: `${BASE_URL}/stories`,
      method: "GET",
    });

    // turn plain old story objects from API into instances of Story class
    const stories = response.data.stories.map(story => new Story(story));

    // build an instance of our own class using the new array of stories
    return new StoryList(stories);
  }

  /** Adds story data to API, makes a Story instance, adds it to story list.
   * - user - the current instance of User who will post the story
   * - obj of {title, author, url}
   *
   * Returns the new Story instance
   */

  async addStory(user, newStory) {
    let url = newStory.url;
    let title = newStory.title;
    let author = newStory.author;
    const response = await axios.post(`${BASE_URL}/stories`, { token: user.loginToken, story: { author, title, url } })
    newStory = new Story(response.data.story);
    currentUser.ownStories.unshift(newStory);
    this.stories.unshift(newStory);
    return newStory;
  }
}


/******************************************************************************
 * User: a user in the system (only used to represent the current user)
 */

class User {
  /** Make user instance from obj of user data and a token:
   *   - {username, name, createdAt, favorites[], ownStories[]}
   *   - token
   */

  constructor({
    username,
    name,
    createdAt,
    favorites = [],
    ownStories = []
  },
    token) {
    this.username = username;
    this.name = name;
    this.createdAt = createdAt;

    // instantiate Story instances for the user's favorites and ownStories
    this.favorites = favorites.map(s => new Story(s));
    this.ownStories = ownStories.map(s => new Story(s));

    // store the login token on the user so it's easy to find for API calls.
    this.loginToken = token;
  }

  /** Register new user in API, make User instance & return it.
   *
   * - username: a new username
   * - password: a new password
   * - name: the user's full name
   */

  static async signup(username, password, name) {
    const response = await axios({
      url: `${BASE_URL}/signup`,
      method: "POST",
      data: { user: { username, password, name } },
    });

    let { user } = response.data

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** Login in user with API, make User instance & return it.

   * - username: an existing user's username
   * - password: an existing user's password
   */

  static async login(username, password) {
    const response = await axios({
      url: `${BASE_URL}/login`,
      method: "POST",
      data: { user: { username, password } },
    });

    let { user } = response.data;

    return new User(
      {
        username: user.username,
        name: user.name,
        createdAt: user.createdAt,
        favorites: user.favorites,
        ownStories: user.stories
      },
      response.data.token
    );
  }

  /** When we already have credentials (token & username) for a user,
   *   we can log them in automatically. This function does that.
   */
  static async loginViaStoredCredentials(token, username) {
    try {
      const response = await axios({
        url: `${BASE_URL}/users/${username}`,
        method: "GET",
        params: { token },
      });

      let { user } = response.data;

      return new User(
        {
          username: user.username,
          name: user.name,
          createdAt: user.createdAt,
          favorites: user.favorites,
          ownStories: user.stories
        },
        token
      );
    } catch (err) {
      console.error("loginViaStoredCredentials failed", err);
      return null;
    }
  }



  //Adds favorite to user via api and locally
  async addFavorite(storyId) {
    let res = await axios.post(`${BASE_URL}/users/${this.username}/favorites/${storyId}`, { token: this.loginToken });
    this.favorites = res.data.user.favorites;
  }

  //Returns users array of favorites
  async getFavoriteList() {
    let response = await axios.get(`${BASE_URL}/users/${this.username}`);
    return response.data.favorites;
  }

  //Removes favorite from user via api and updates local favorite list
  //Axios delete alias does not work as intended, so normal format utilized
  removeFavorite(storyId) {
    axios({
      url: `${BASE_URL}/users/${this.username}/favorites/${storyId}`,
      method: "DELETE",
      data: { token: this.loginToken }
    });
    this.favorites = this.favorites.filter(function (favorite) {
      return !favorite.storyId === storyId;
    });
  }

  //Adds only users favorites to page
  putFavoritesOnPage() {
    const favorites = this.favorites.map(story => new Story(story));
    storyList = new StoryList(favorites);

    if (this.favorites == "") {
      $emptyFavMsg.show();
    }
    putStoriesOnPage();
  }

  //Adds only users own stories to page
  putOwnOnPage() {
    const ownStories = this.ownStories.map(story => new Story(story));
    storyList = new StoryList(ownStories);
    if (this.ownStories == "") {
      $emptyOwnMsg.show();
    }
    putStoriesOnPage();
  }

  //Returns true or false that a story is favorited
  isFavorite(storyId) {
    return this.favorites.some(function (favorite) {
      return favorite.storyId === storyId;
    });
  }

  //Removes story from api and updates local story lists
  //Returns response status
  async removeStory(storyId) {
    let res = await axios({
      url: `${BASE_URL}/stories/${storyId}`,
      method: "DELETE",
      data: { token: this.loginToken }
    });

    this.ownStories = this.ownStories.filter(function (story) {
      return story.storyId !== storyId;
    });
    this.favorites = this.favorites.filter(function (story) {
      return story.storyId !== storyId;
    });
    return res;
  }
}
