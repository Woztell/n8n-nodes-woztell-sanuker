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

/**
 * get members by tags
 * variable: channelId, first, tagFilters
 */
export const getMembersQuery = `query getMembers(
  $first: IntMax100
  $channelId: String
  $tagFilters: [TagFilter]
  $after: String
) {
  apiViewer {
    members(first: $first, channelId: $channelId, tagFilters: $tagFilters, after: $after) {
      edges {
        node {
          _id
          externalId
          name
          tags
        }
      }
      pageInfo {
        hasNextPage
        totalCount
        endCursor
      }
    }
  }
}
`;

/**
 * add member tags
 * variable: channelId, externalId, tags
 */
export const addMemberTags = `mutation AddMemberTags($input: ModifyMemberTagsInput!) {
  addMemberTags(input: $input) {
    err_code
    member {
      _id
      externalId
    }
    memberId
    ok
  }
}
`;

/**
 * batch update members
 */
export const batchUpdateMemberInput = `mutation batchUpdateMemberTags($input: BatchUpdateMemberInput!) {
  batchUpdateMember(input: $input) {
    clientMutationId
  }
}
`;

/**
 * get member info
 * variable: channelId, externalId
 */
export const getMemberInfoQuery = `query getMemberInfo($channelId: ID, $externalId: ID) {
  apiViewer {
    member(channelId: $channelId, externalId: $externalId) {
      _id
      createdAt
      updatedAt
      channelId
      platform
      tags
      meta
      botMeta {
        subscribe
        liveChat
        treeId
        nodeCompositeId
        tree {
          name
        }
        node {
          name
        }
      }
      name
      firstName
      lastName
      gender
      customLocale
      locale
      email
    }
  }
}
`;

/**
 * get conversation history
 * variable: channelId, memberId
 */
export const getConversationHistoryQuery = `query getConversationHistory(
  $channelId: String
  $memberId: String
  $last: IntMax100
  $before: String
) {
  apiViewer {
    conversationHistory(
      channelId: $channelId
      memberId: $memberId
      last: $last
      before: $before
    ) {
      edges {
        node {
          _id
          messageEvent
          id
          createdAt
          updatedAt
          sentAt
          readAt
          deliveredAt
          deletedAt
          from
          member {
            name
          }
          memberId
          errors
          failedAt
          platform
          channel {
            name
          }
          channelId
          tags
          meta
          etag
          isMultipleParty
        }
      }
      pageInfo {
        hasPreviousPage
        startCursor
      }
    }
  }
}

`;

/**
 * get memberId
 * variable: channelId, externalId
 */
export const getMemberIdQuery = `query getMemberId($channelId: ID, $externalId: ID) {
  apiViewer {
    member(channelId: $channelId, externalId: $externalId) {
      _id
    }
  }
}
`;

/**
 * get trees
 * variable: first, search
 */
export const getTreesQuery = `query getTrees($first: IntMax100, $search: String) {
  apiViewer {
    trees (first: $first, search: $search) {
      edges {
        node {
          name
          _id
        }
      }
    }
  }
}
`;

/**
 * get nodes by treeId
 * variable: treeId
 */
export const getNodesQuery = `query getNodes($treeIds: [ID]) {
  apiViewer {
    nodes (treeIds: $treeIds, first: 100, global: false) {
      edges {
        node {
          _id
          name
          compositeId
        }
      }
    }
  }
}
`;
