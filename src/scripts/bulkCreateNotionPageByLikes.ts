/**
 * Sample:
 * yarn ts-node src/scripts/bulkCreateNotionPageByLikes.ts src/scripts/tmp/likes-sample.js
 */

import process from "process";
import path from "path";
import { createNotionPageByTweet } from "../createNotionPageByTweet";

const fileName = process.argv[2] || "likes.js";
const tweetsJson = require(path.resolve(fileName));
tweetsJson.reverse();

async function addTweetsToNotionDatabase(tweets: any[]) {
  for (const tweet of tweets) {
    await addTweetToNotionDatabase(tweet);
    await new Promise((resolve) => setTimeout(resolve, 500)); // Limit to 3 requests per second, send requests at intervals of 334ms
  }
}

addTweetsToNotionDatabase(tweetsJson);

async function addTweetToNotionDatabase(tweet: any) {
  try {
    const response = await createNotionPageByTweet({
      text: tweet.tweet_content,
      userName: tweet.user_handle,
      linkToTweet: `https://twitter.com/${tweet.user_handle}/status/${tweet.tweet_id}`,
      firstLinkUrl: tweet.tweet_media_urls.length ? tweet.tweet_media_urls[0] : "",
      createdAt: tweet.tweet_created_at,
      embed: `<blockquote class="twitter-tweet">
 <p lang="en" dir="ltr">${tweet.tweet_content}</p>
 &mdash; ${tweet.user_name} (@${tweet.user_handle})
 <a href="https://twitter.com/${tweet.user_handle}/status/${tweet.tweet_id}">${tweet.tweet_created_at}</a>
</blockquote>
<script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>`,
    });
    console.log("New page created:", response.id, tweet.tweet_id);
  } catch (error: any) {
    if (error.code) {
      console.error("API error:", error.code, error.message);
    } else {
      console.error("Unknown error:", error);
    }
  }
}
