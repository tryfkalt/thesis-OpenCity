import {
  HazardAdded as HazardAddedEvent,
  OwnershipTransferred as OwnershipTransferredEvent,
} from "../generated/HazardProposal/HazardProposal"
import { HazardAdded, OwnershipTransferred } from "../generated/schema"

export function handleHazardAdded(event: HazardAddedEvent): void {
  let entity = new HazardAdded(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.hazardId = event.params.hazardId
  entity.title = event.params.title
  entity.description = event.params.description
  entity.latitude = event.params.latitude
  entity.longitude = event.params.longitude

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}

export function handleOwnershipTransferred(
  event: OwnershipTransferredEvent,
): void {
  let entity = new OwnershipTransferred(
    event.transaction.hash.concatI32(event.logIndex.toI32()),
  )
  entity.previousOwner = event.params.previousOwner
  entity.newOwner = event.params.newOwner

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()
}
