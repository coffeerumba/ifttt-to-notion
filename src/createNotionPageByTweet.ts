import { Client } from "@notionhq/client";
import { convertToISO8601 } from "./convertToISO8601";
import { parseTextAndUrl } from "./parseTextAndUrl";
import { QueryDatabaseResponse } from '@notionhq/client/build/src/api-endpoints';

type Args = {
  text: string;
  userName: string;
  linkToTweet: string;
  firstLinkUrl: string;
  createdAt?: string;
  embed: string;
};

const apiKey = process.env.NOTION_API_KEY;
const databaseId = process.env.DATABASE_ID;

const notion = new Client({ auth: apiKey });

const extractId = (url: string) => {
  const idStr = url.match(/status\/(\d+)/)?.[1];
  if (!idStr) {
    throw new Error("idを取得できませんでした");
  }
  return parseInt(idStr);
};

export async function createNotionPageByTweet({
  text,
  userName,
  linkToTweet,
  firstLinkUrl,
  createdAt,
  embed,
}: Args) {
  const properties: Parameters<typeof notion.pages.create>[0]["properties"] = {
    tweet: {
      title: [
        {
          text: {
            content: text,
          },
        },
      ],
    },
    user_id: {
      type: "rich_text",
      rich_text: [
        {
          text: {
            content: userName,
            link: {
              url: `https://twitter.com/${userName}`,
            },
          },
        },
      ],
    },
    url: {
      url: linkToTweet,
    },
    first_link_url: {
      url: firstLinkUrl,
    },
    embed: {
      type: "rich_text",
      rich_text: [
        {
          text: {
            content: embed,
          },
        },
      ],
    },
    tweet_id: {
      type: "number",
      number: extractId(linkToTweet),
    },
  };

  if (createdAt) {
    properties["tweeted_at"] = {
      type: "date",
      date: {
        start: convertToISO8601(createdAt),
      },
    };
  }
  
  const response: QueryDatabaseResponse = await notion.databases.query({
    database_id: databaseId ?? '',
    filter: {
      property: 'tweet_id',
      number: {
        equals: extractId(linkToTweet)
      }
    }
  });
  if (response.results.length) {
    console.log("すでに登録されているtweet_idです。" + extractId(linkToTweet));
    return false;
  }
  
  return notion.pages.create({
    parent: { database_id: databaseId ?? '' },
    properties,
    /*
    children: [
      {
        "object": "block",
        "heading_2": {
          "rich_text": [
            {
              "text": {
                "content": "Lacinato kale"
              }
            }
          ]
        }
      }
    ]
    */
  });
}
