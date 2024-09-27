import { Client } from "@notionhq/client";
import { convertToISO8601 } from "./convertToISO8601";
import { parseTextAndUrl } from "./parseTextAndUrl";

type Args = {
  text: string;
  username: string;
  url: string;
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
  username,
  url,
  createdAt,
  embed,
}: Args) {
  const properties: Parameters<typeof notion.pages.create>[0]["properties"] = {
    text: {
      type: "rich_text",
      rich_text: await parseTextAndUrl(text),
    },
    title: {
      title: [
        {
          text: {
            content: text,
          },
        },
      ],
    },
    url: {
      url: url,
    },
    username: {
      type: "rich_text",
      rich_text: [
        {
          text: {
            content: username,
            link: {
              url: `https://twitter.com/${username}`,
            },
          },
        },
      ],
    },
  };

  if (createdAt) {
    properties["tweet_created_at"] = {
      type: "date",
      date: {
        start: convertToISO8601(createdAt),
      },
    };
  }

  return notion.pages.create({
    parent: { database_id: databaseId ?? '' },
    properties,
  });
}
