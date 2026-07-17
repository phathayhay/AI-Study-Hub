# VNPAY Sandbox setup

This integration uses VNPAY PAY API 2.1.0 and HMAC-SHA512. It does not use production credentials or process production payments.

## Configure

1. Register a VNPAY Sandbox merchant and obtain `VNPAY_TMN_CODE` and `VNPAY_HASH_SECRET`.
2. Copy the VNPAY entries from `.env.example` into the local ignored `.env` file.
3. Set `PAYMENT_PROVIDER=VNPAY` and keep `PAYMENT_MODE=SANDBOX`.
4. Start the backend and frontend with `run-project.ps1`.
5. Expose port 8080 through a public HTTPS tunnel.
6. Set `VNPAY_IPN_URL` to `https://your-public-host/api/payments/vnpay/ipn` and configure the same IPN URL in the VNPAY Sandbox merchant settings. Update it whenever the tunnel hostname changes.
7. Restart the backend after changing `.env`.

`VNPAY_HASH_SECRET` and `VNPAY_TMN_CODE` are backend-only. Never add them to a `VITE_` variable.

## Test checkout

1. Sign in to AI Study Hub.
2. Open Pricing and select PRO or PREMIUM.
3. Confirm the backend-calculated amount, then choose **Continue to VNPAY**.
4. Select a Sandbox payment method, such as the NCB test bank.
5. Use only the test-card and OTP details published by VNPAY Sandbox.
6. Complete or cancel the payment.
7. VNPAY returns the browser to `/payment-result?orderCode=...`.
8. The result page reads status from the authenticated backend API. It never trusts VNPAY result values from the browser URL.
9. Confirm the user remains signed in and the current subscription/benefits refresh after a successful IPN.

## Callback behavior

- Return URL verifies the signature and order data, then redirects the browser. It never activates a subscription.
- IPN is public but accepts state changes only after signature, merchant, transaction reference, amount, response code, and transaction status validation.
- Repeated terminal IPNs are idempotent and cannot create a second subscription.
- The admin QueryDR endpoint is `POST /api/admin/payments/vnpay/{orderCode}/query`. A successful, signed QueryDR result can reconcile a pending payment.

The backend stores amounts in actual VND. Only the VNPAY request/callback representation uses VND multiplied by 100.
