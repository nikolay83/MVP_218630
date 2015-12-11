# Database changes in assembly MiscUpdate5 #

To apply the changes to an existing database, please execute the
migration script:

`cd mom_api`
`node migrate/migrate-09.09.js`

## Business

- The field Business#conditions has been removed

## GiftCardOffer

- The field GiftCardOffer#conditions is now of type String (it was [String])

# Database changes in assembly ReleaseFall2015 #

To apply the changes to an existing database, please execute the
migration script:

`cd mom_api`
`node migrate/migrate-09.27.js`

## Users

 - Add signedUpDate
 - Add verifiedDate
 - Add subscribedToNews

## ActionRecord

 - Add amount
 - Add giftCardId
 - Add giftCardOfferId
 - Add target
 - Add experienceRating

## GiftCardOffer

 - Add businessDescription
