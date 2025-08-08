/**
 * get channel list
 * variable: first(IntMax100), search, type
 */
export const getChannelsQuery = `query getChannels($first: IntMax100, $search: String, $type: String) {
  apiViewer {
    channels(first: $first, search: $search, type: $type) {
      edges {
        node {
          _id
          name
          type
        }
      }
    }
  }
}
`;

/**
 * get channel by channelId
 * variable: channelId
 */
export const getChannelQuery = `query getChannel($type: String, $channelId: ID) {
  apiViewer {
    channels(type: $type, channelIds: [$channelId]) {
      edges {
        node {
          _id
          name
          environments {
            envId
            name
            integration {
              _id
              meta
            }
          }
        }
      }
    }
  }
}
`;
