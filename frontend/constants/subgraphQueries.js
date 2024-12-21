import { gql } from "@apollo/client";

const GET_PROPOSALS = gql`
  {
    proposalCreateds(orderBy: blockTimestamp, orderDirection: desc, first: 5) {
      id
      proposalId
      proposer
      description
      blockTimestamp
    }
  }
`;

const GET_PROPOSAL_BY_ID = gql`
  query GetProposalById($proposalId: ID!) {
    proposalCreateds(where: { proposalId: $proposalId }) {
      id
      proposalId
      proposer
      targets
      description
    }
  }
`;

const GET_EXECUTED_PROPOSALS = gql`
  {
    proposalExecuteds(first: 2) {
      id
      proposalId
    }
  }
`;

export { GET_PROPOSALS, GET_PROPOSAL_BY_ID, GET_EXECUTED_PROPOSALS };
