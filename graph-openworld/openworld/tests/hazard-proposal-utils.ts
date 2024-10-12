import { newMockEvent } from "matchstick-as"
import { ethereum, BigInt, Address } from "@graphprotocol/graph-ts"
import {
  HazardAdded,
  OwnershipTransferred
} from "../generated/HazardProposal/HazardProposal"

export function createHazardAddedEvent(
  hazardId: BigInt,
  title: string,
  description: string,
  latitude: BigInt,
  longitude: BigInt
): HazardAdded {
  let hazardAddedEvent = changetype<HazardAdded>(newMockEvent())

  hazardAddedEvent.parameters = new Array()

  hazardAddedEvent.parameters.push(
    new ethereum.EventParam(
      "hazardId",
      ethereum.Value.fromUnsignedBigInt(hazardId)
    )
  )
  hazardAddedEvent.parameters.push(
    new ethereum.EventParam("title", ethereum.Value.fromString(title))
  )
  hazardAddedEvent.parameters.push(
    new ethereum.EventParam(
      "description",
      ethereum.Value.fromString(description)
    )
  )
  hazardAddedEvent.parameters.push(
    new ethereum.EventParam(
      "latitude",
      ethereum.Value.fromSignedBigInt(latitude)
    )
  )
  hazardAddedEvent.parameters.push(
    new ethereum.EventParam(
      "longitude",
      ethereum.Value.fromSignedBigInt(longitude)
    )
  )

  return hazardAddedEvent
}

export function createOwnershipTransferredEvent(
  previousOwner: Address,
  newOwner: Address
): OwnershipTransferred {
  let ownershipTransferredEvent = changetype<OwnershipTransferred>(
    newMockEvent()
  )

  ownershipTransferredEvent.parameters = new Array()

  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam(
      "previousOwner",
      ethereum.Value.fromAddress(previousOwner)
    )
  )
  ownershipTransferredEvent.parameters.push(
    new ethereum.EventParam("newOwner", ethereum.Value.fromAddress(newOwner))
  )

  return ownershipTransferredEvent
}
