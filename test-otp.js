// Email OTP Testing Script
// Run this in the browser console to test the OTP functionality

async function testEmailOTP() {
  console.log('🔥 Testing HYBE Email OTP System');
  console.log('================================');

  const testEmail = 'test@example.com';

  try {
    // Test 1: Send OTP
    console.log('📧 Step 1: Sending OTP...');
    const sendResponse = await fetch('/send-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: testEmail })
    });

    const sendResult = await sendResponse.json();
    console.log('✅ Send OTP Response:', sendResult);

    if (!sendResult.success) {
      console.error('❌ Failed to send OTP:', sendResult.error);
      return;
    }

    // Test 2: Try to verify with wrong OTP
    console.log('🔍 Step 2: Testing wrong OTP...');
    const wrongOtpResponse = await fetch('/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        email: testEmail, 
        otp: '123456' // Wrong OTP
      })
    });

    const wrongOtpResult = await wrongOtpResponse.json();
    console.log('❌ Wrong OTP Response (expected to fail):', wrongOtpResult);

    // Test 3: Check development mode behavior
    if (sendResult.method === 'console') {
      console.log('🔧 Development Mode');
      if (sendResult.debugOtp) {
        console.log('🧪 Using debugOtp from response for verification');
        const devOtpResponse = await fetch('/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: testEmail, otp: String(sendResult.debugOtp) })
        });
        const devOtpResult = await devOtpResponse.json();
        console.log('✅ Dev OTP Response:', devOtpResult);
        if (devOtpResult.success) {
          console.log('🎉 Email OTP system working correctly in development mode!');
          console.log('📧 Verification token:', devOtpResult.verificationToken);
        }
      } else {
        console.log('📝 Check server logs for the OTP code and verify manually.');
      }
    }

    // Test 4: Rate limiting
    console.log('⏱️ Step 4: Testing rate limiting...');
    for (let i = 0; i < 5; i++) {
      const rateLimitResponse = await fetch('/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: testEmail })
      });
      
      const rateLimitResult = await rateLimitResponse.json();
      console.log(`📊 Rate limit test ${i + 1}:`, rateLimitResult);
      
      if (rateLimitResponse.status === 429) {
        console.log('✅ Rate limiting working correctly!');
        break;
      }
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  }

  console.log('🏁 OTP testing completed');
}

// Test form integration
function testFormIntegration() {
  console.log('📋 Testing form integration...');
  
  const emailInput = document.getElementById('email');
  const verifyBtn = document.getElementById('verify-email-btn');
  
  if (emailInput && verifyBtn) {
    emailInput.value = 'test@example.com';
    console.log('✅ Found email input and verify button');
    console.log('🖱️ Click the "Verify" button to test the UI integration');
  } else {
    console.log('❌ Email input or verify button not found');
  }
}

// Run tests
console.log('🚀 HYBE Email OTP Test Suite');
console.log('==========================');
console.log('Run testEmailOTP() to test the API endpoints');
console.log('Run testFormIntegration() to test form integration');

// Auto-run the tests if desired
// testEmailOTP();
// testFormIntegration();
