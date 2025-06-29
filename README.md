
Form Submission Logic:
•	User selects Full Payment or Installment.
•	If user selects Card Payment and clicks Submit Subscription, trigger the payment validation logic once user completes form and clicks on submit subscription:
•	Display a beautiful popup card modal with a mini loading spinner Notifying user that they'll be redirected to our payment gateway system in 5 sec(5sec countdown) for their HYBE subscription payment completion in 5 secs, They should not refresh this page.
•	Redirect user to a new page with Stripe Checkout card modal:
•	If Full Payment: show one-time payment amount for payment.
•	If Installment: show amount for installment payment.
•	User completes Stripe payment.
•	On successful payment:
•	Redirect user to a Success Page.
•	Show message:
“Your payment has been received. You’ll receive more details via email once it’s validated on the HYBE-PERMIT Subscription Database.”
•	Include a “Continue to HYBECORP.COM” button that links to https://hybecorp.