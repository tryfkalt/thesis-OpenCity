import {
  assert,
  describe,
  test,
  clearStore,
  beforeAll,
  afterAll
} from "matchstick-as/assembly/index"
import { BigInt, Address } from "@graphprotocol/graph-ts"
import { HazardAdded } from "../generated/schema"
import { HazardAdded as HazardAddedEvent } from "../generated/HazardProposal/HazardProposal"
import { handleHazardAdded } from "../src/hazard-proposal"
import { createHazardAddedEvent } from "./hazard-proposal-utils"

// Tests structure (matchstick-as >=0.5.0)
// https://thegraph.com/docs/en/developer/matchstick/#tests-structure-0-5-0

describe("Describe entity assertions", () => {
  beforeAll(() => {
    let hazardId = BigInt.fromI32(234)
    let title = "Example string value"
    let description = "Example string value"
    let latitude = BigInt.fromI32(234)
    let longitude = BigInt.fromI32(234)
    let newHazardAddedEvent = createHazardAddedEvent(
      hazardId,
      title,
      description,
      latitude,
      longitude
    )
    handleHazardAdded(newHazardAddedEvent)
  })

  afterAll(() => {
    clearStore()
  })

  // For more test scenarios, see:
  // https://thegraph.com/docs/en/developer/matchstick/#write-a-unit-test

  test("HazardAdded created and stored", () => {
    assert.entityCount("HazardAdded", 1)

    // 0xa16081f360e3847006db660bae1c6d1b2e17ec2a is the default address used in newMockEvent() function
    assert.fieldEquals(
      "HazardAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "hazardId",
      "234"
    )
    assert.fieldEquals(
      "HazardAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "title",
      "Example string value"
    )
    assert.fieldEquals(
      "HazardAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "description",
      "Example string value"
    )
    assert.fieldEquals(
      "HazardAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "latitude",
      "234"
    )
    assert.fieldEquals(
      "HazardAdded",
      "0xa16081f360e3847006db660bae1c6d1b2e17ec2a-1",
      "longitude",
      "234"
    )

    // More assert options:
    // https://thegraph.com/docs/en/developer/matchstick/#asserts
  })
})
