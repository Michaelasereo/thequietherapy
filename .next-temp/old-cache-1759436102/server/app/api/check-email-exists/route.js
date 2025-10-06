/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/check-email-exists/route";
exports.ids = ["app/api/check-email-exists/route"];
exports.modules = {

/***/ "(rsc)/./app/api/check-email-exists/route.ts":
/*!*********************************************!*\
  !*** ./app/api/check-email-exists/route.ts ***!
  \*********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\n\nasync function POST(request) {\n    try {\n        const { email, userType } = await request.json();\n        if (!email) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Email is required'\n            }, {\n                status: 400\n            });\n        }\n        // Create Supabase client\n        const supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(\"https://frzciymslvpohhyefmtr.supabase.co\", process.env.SUPABASE_SERVICE_ROLE_KEY);\n        // Check if email exists in users table\n        const { data: userData, error: userError } = await supabase.from('users').select('id, email, user_type, is_verified').eq('email', email.trim()).single();\n        // Check if email exists in therapist_enrollments table\n        const { data: therapistData, error: therapistError } = await supabase.from('therapist_enrollments').select('id, email, status').eq('email', email.trim()).single();\n        const exists = !!(userData || therapistData);\n        let message = '';\n        let canEnroll = true;\n        let redirectTo = '';\n        // Allow multiple roles for the same email\n        if (userData) {\n            // Check if user already has this specific role\n            if (userData.user_type === userType) {\n                if (userData.is_verified) {\n                    message = `You are already enrolled as a ${userType} and verified! Please use the login page to access your dashboard.`;\n                    canEnroll = false;\n                    redirectTo = `/${userType === 'therapist' ? 'therapist' : userType === 'partner' ? 'partner' : userType === 'admin' ? 'admin' : ''}/login`;\n                } else {\n                    message = `You have already enrolled as a ${userType} but need to verify your email. Please check your email for the verification link.`;\n                    canEnroll = false;\n                    redirectTo = `/${userType === 'therapist' ? 'therapist' : userType === 'partner' ? 'partner' : userType === 'admin' ? 'admin' : ''}/login`;\n                }\n            } else {\n                // User exists but with different role - allow enrollment for new role\n                message = `You are already registered as a ${userData.user_type}. You can also enroll as a ${userType} with the same email.`;\n                canEnroll = true;\n            }\n        } else if (therapistData) {\n            if (therapistData.status === 'pending') {\n                message = 'You have already enrolled as a therapist but your application is pending approval. Please check your email for the verification link.';\n                canEnroll = false;\n                redirectTo = '/therapist/login';\n            } else if (therapistData.status === 'approved') {\n                message = 'You are already enrolled as a therapist and approved! Please use the login page to access your dashboard.';\n                canEnroll = false;\n                redirectTo = '/therapist/login';\n            } else if (therapistData.status === 'rejected') {\n                message = 'Your previous therapist enrollment was rejected. You can still enroll for other roles or contact support for assistance.';\n                canEnroll = true;\n            }\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            exists,\n            canEnroll,\n            message,\n            redirectTo,\n            userType: userData?.user_type,\n            isVerified: userData?.is_verified,\n            status: therapistData?.status\n        });\n    } catch (error) {\n        console.error('Error checking email:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            error: 'Internal server error'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2NoZWNrLWVtYWlsLWV4aXN0cy9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBdUQ7QUFDSDtBQUU3QyxlQUFlRSxLQUFLQyxPQUFvQjtJQUM3QyxJQUFJO1FBQ0YsTUFBTSxFQUFFQyxLQUFLLEVBQUVDLFFBQVEsRUFBRSxHQUFHLE1BQU1GLFFBQVFHLElBQUk7UUFFOUMsSUFBSSxDQUFDRixPQUFPO1lBQ1YsT0FBT0oscURBQVlBLENBQUNNLElBQUksQ0FBQztnQkFBRUMsT0FBTztZQUFvQixHQUFHO2dCQUFFQyxRQUFRO1lBQUk7UUFDekU7UUFFQSx5QkFBeUI7UUFDekIsTUFBTUMsV0FBV1IsbUVBQVlBLENBQzNCUywwQ0FBb0MsRUFDcENBLFFBQVFDLEdBQUcsQ0FBQ0UseUJBQXlCO1FBR3ZDLHVDQUF1QztRQUN2QyxNQUFNLEVBQUVDLE1BQU1DLFFBQVEsRUFBRVIsT0FBT1MsU0FBUyxFQUFFLEdBQUcsTUFBTVAsU0FDaERRLElBQUksQ0FBQyxTQUNMQyxNQUFNLENBQUMscUNBQ1BDLEVBQUUsQ0FBQyxTQUFTZixNQUFNZ0IsSUFBSSxJQUN0QkMsTUFBTTtRQUVULHVEQUF1RDtRQUN2RCxNQUFNLEVBQUVQLE1BQU1RLGFBQWEsRUFBRWYsT0FBT2dCLGNBQWMsRUFBRSxHQUFHLE1BQU1kLFNBQzFEUSxJQUFJLENBQUMseUJBQ0xDLE1BQU0sQ0FBQyxxQkFDUEMsRUFBRSxDQUFDLFNBQVNmLE1BQU1nQixJQUFJLElBQ3RCQyxNQUFNO1FBRVQsTUFBTUcsU0FBUyxDQUFDLENBQUVULENBQUFBLFlBQVlPLGFBQVk7UUFFMUMsSUFBSUcsVUFBVTtRQUNkLElBQUlDLFlBQVk7UUFDaEIsSUFBSUMsYUFBYTtRQUVqQiwwQ0FBMEM7UUFDMUMsSUFBSVosVUFBVTtZQUNaLCtDQUErQztZQUMvQyxJQUFJQSxTQUFTYSxTQUFTLEtBQUt2QixVQUFVO2dCQUNuQyxJQUFJVSxTQUFTYyxXQUFXLEVBQUU7b0JBQ3hCSixVQUFVLENBQUMsOEJBQThCLEVBQUVwQixTQUFTLGtFQUFrRSxDQUFDO29CQUN2SHFCLFlBQVk7b0JBQ1pDLGFBQWEsQ0FBQyxDQUFDLEVBQUV0QixhQUFhLGNBQWMsY0FBY0EsYUFBYSxZQUFZLFlBQVlBLGFBQWEsVUFBVSxVQUFVLEdBQUcsTUFBTSxDQUFDO2dCQUM1SSxPQUFPO29CQUNMb0IsVUFBVSxDQUFDLCtCQUErQixFQUFFcEIsU0FBUyxrRkFBa0YsQ0FBQztvQkFDeElxQixZQUFZO29CQUNaQyxhQUFhLENBQUMsQ0FBQyxFQUFFdEIsYUFBYSxjQUFjLGNBQWNBLGFBQWEsWUFBWSxZQUFZQSxhQUFhLFVBQVUsVUFBVSxHQUFHLE1BQU0sQ0FBQztnQkFDNUk7WUFDRixPQUFPO2dCQUNMLHNFQUFzRTtnQkFDdEVvQixVQUFVLENBQUMsZ0NBQWdDLEVBQUVWLFNBQVNhLFNBQVMsQ0FBQywyQkFBMkIsRUFBRXZCLFNBQVMscUJBQXFCLENBQUM7Z0JBQzVIcUIsWUFBWTtZQUNkO1FBQ0YsT0FBTyxJQUFJSixlQUFlO1lBQ3hCLElBQUlBLGNBQWNkLE1BQU0sS0FBSyxXQUFXO2dCQUN0Q2lCLFVBQVU7Z0JBQ1ZDLFlBQVk7Z0JBQ1pDLGFBQWE7WUFDZixPQUFPLElBQUlMLGNBQWNkLE1BQU0sS0FBSyxZQUFZO2dCQUM5Q2lCLFVBQVU7Z0JBQ1ZDLFlBQVk7Z0JBQ1pDLGFBQWE7WUFDZixPQUFPLElBQUlMLGNBQWNkLE1BQU0sS0FBSyxZQUFZO2dCQUM5Q2lCLFVBQVU7Z0JBQ1ZDLFlBQVk7WUFDZDtRQUNGO1FBRUEsT0FBTzFCLHFEQUFZQSxDQUFDTSxJQUFJLENBQUM7WUFDdkJrQjtZQUNBRTtZQUNBRDtZQUNBRTtZQUNBdEIsVUFBVVUsVUFBVWE7WUFDcEJFLFlBQVlmLFVBQVVjO1lBQ3RCckIsUUFBUWMsZUFBZWQ7UUFDekI7SUFFRixFQUFFLE9BQU9ELE9BQU87UUFDZHdCLFFBQVF4QixLQUFLLENBQUMseUJBQXlCQTtRQUN2QyxPQUFPUCxxREFBWUEsQ0FBQ00sSUFBSSxDQUFDO1lBQUVDLE9BQU87UUFBd0IsR0FBRztZQUFFQyxRQUFRO1FBQUk7SUFDN0U7QUFDRiIsInNvdXJjZXMiOlsiL1VzZXJzL21hY2Jvb2svRGVza3RvcC90cnBpLWFwcC9hcHAvYXBpL2NoZWNrLWVtYWlsLWV4aXN0cy9yb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVxdWVzdCwgTmV4dFJlc3BvbnNlIH0gZnJvbSAnbmV4dC9zZXJ2ZXInXG5pbXBvcnQgeyBjcmVhdGVDbGllbnQgfSBmcm9tICdAc3VwYWJhc2Uvc3VwYWJhc2UtanMnXG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBQT1NUKHJlcXVlc3Q6IE5leHRSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBlbWFpbCwgdXNlclR5cGUgfSA9IGF3YWl0IHJlcXVlc3QuanNvbigpXG4gICAgXG4gICAgaWYgKCFlbWFpbCkge1xuICAgICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHsgZXJyb3I6ICdFbWFpbCBpcyByZXF1aXJlZCcgfSwgeyBzdGF0dXM6IDQwMCB9KVxuICAgIH1cblxuICAgIC8vIENyZWF0ZSBTdXBhYmFzZSBjbGllbnRcbiAgICBjb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcbiAgICAgIHByb2Nlc3MuZW52Lk5FWFRfUFVCTElDX1NVUEFCQVNFX1VSTCEsXG4gICAgICBwcm9jZXNzLmVudi5TVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIVxuICAgIClcblxuICAgIC8vIENoZWNrIGlmIGVtYWlsIGV4aXN0cyBpbiB1c2VycyB0YWJsZVxuICAgIGNvbnN0IHsgZGF0YTogdXNlckRhdGEsIGVycm9yOiB1c2VyRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAuZnJvbSgndXNlcnMnKVxuICAgICAgLnNlbGVjdCgnaWQsIGVtYWlsLCB1c2VyX3R5cGUsIGlzX3ZlcmlmaWVkJylcbiAgICAgIC5lcSgnZW1haWwnLCBlbWFpbC50cmltKCkpXG4gICAgICAuc2luZ2xlKClcblxuICAgIC8vIENoZWNrIGlmIGVtYWlsIGV4aXN0cyBpbiB0aGVyYXBpc3RfZW5yb2xsbWVudHMgdGFibGVcbiAgICBjb25zdCB7IGRhdGE6IHRoZXJhcGlzdERhdGEsIGVycm9yOiB0aGVyYXBpc3RFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgIC5mcm9tKCd0aGVyYXBpc3RfZW5yb2xsbWVudHMnKVxuICAgICAgLnNlbGVjdCgnaWQsIGVtYWlsLCBzdGF0dXMnKVxuICAgICAgLmVxKCdlbWFpbCcsIGVtYWlsLnRyaW0oKSlcbiAgICAgIC5zaW5nbGUoKVxuXG4gICAgY29uc3QgZXhpc3RzID0gISEodXNlckRhdGEgfHwgdGhlcmFwaXN0RGF0YSlcbiAgICBcbiAgICBsZXQgbWVzc2FnZSA9ICcnXG4gICAgbGV0IGNhbkVucm9sbCA9IHRydWVcbiAgICBsZXQgcmVkaXJlY3RUbyA9ICcnXG5cbiAgICAvLyBBbGxvdyBtdWx0aXBsZSByb2xlcyBmb3IgdGhlIHNhbWUgZW1haWxcbiAgICBpZiAodXNlckRhdGEpIHtcbiAgICAgIC8vIENoZWNrIGlmIHVzZXIgYWxyZWFkeSBoYXMgdGhpcyBzcGVjaWZpYyByb2xlXG4gICAgICBpZiAodXNlckRhdGEudXNlcl90eXBlID09PSB1c2VyVHlwZSkge1xuICAgICAgICBpZiAodXNlckRhdGEuaXNfdmVyaWZpZWQpIHtcbiAgICAgICAgICBtZXNzYWdlID0gYFlvdSBhcmUgYWxyZWFkeSBlbnJvbGxlZCBhcyBhICR7dXNlclR5cGV9IGFuZCB2ZXJpZmllZCEgUGxlYXNlIHVzZSB0aGUgbG9naW4gcGFnZSB0byBhY2Nlc3MgeW91ciBkYXNoYm9hcmQuYFxuICAgICAgICAgIGNhbkVucm9sbCA9IGZhbHNlXG4gICAgICAgICAgcmVkaXJlY3RUbyA9IGAvJHt1c2VyVHlwZSA9PT0gJ3RoZXJhcGlzdCcgPyAndGhlcmFwaXN0JyA6IHVzZXJUeXBlID09PSAncGFydG5lcicgPyAncGFydG5lcicgOiB1c2VyVHlwZSA9PT0gJ2FkbWluJyA/ICdhZG1pbicgOiAnJ30vbG9naW5gXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgbWVzc2FnZSA9IGBZb3UgaGF2ZSBhbHJlYWR5IGVucm9sbGVkIGFzIGEgJHt1c2VyVHlwZX0gYnV0IG5lZWQgdG8gdmVyaWZ5IHlvdXIgZW1haWwuIFBsZWFzZSBjaGVjayB5b3VyIGVtYWlsIGZvciB0aGUgdmVyaWZpY2F0aW9uIGxpbmsuYFxuICAgICAgICAgIGNhbkVucm9sbCA9IGZhbHNlXG4gICAgICAgICAgcmVkaXJlY3RUbyA9IGAvJHt1c2VyVHlwZSA9PT0gJ3RoZXJhcGlzdCcgPyAndGhlcmFwaXN0JyA6IHVzZXJUeXBlID09PSAncGFydG5lcicgPyAncGFydG5lcicgOiB1c2VyVHlwZSA9PT0gJ2FkbWluJyA/ICdhZG1pbicgOiAnJ30vbG9naW5gXG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIFVzZXIgZXhpc3RzIGJ1dCB3aXRoIGRpZmZlcmVudCByb2xlIC0gYWxsb3cgZW5yb2xsbWVudCBmb3IgbmV3IHJvbGVcbiAgICAgICAgbWVzc2FnZSA9IGBZb3UgYXJlIGFscmVhZHkgcmVnaXN0ZXJlZCBhcyBhICR7dXNlckRhdGEudXNlcl90eXBlfS4gWW91IGNhbiBhbHNvIGVucm9sbCBhcyBhICR7dXNlclR5cGV9IHdpdGggdGhlIHNhbWUgZW1haWwuYFxuICAgICAgICBjYW5FbnJvbGwgPSB0cnVlXG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0aGVyYXBpc3REYXRhKSB7XG4gICAgICBpZiAodGhlcmFwaXN0RGF0YS5zdGF0dXMgPT09ICdwZW5kaW5nJykge1xuICAgICAgICBtZXNzYWdlID0gJ1lvdSBoYXZlIGFscmVhZHkgZW5yb2xsZWQgYXMgYSB0aGVyYXBpc3QgYnV0IHlvdXIgYXBwbGljYXRpb24gaXMgcGVuZGluZyBhcHByb3ZhbC4gUGxlYXNlIGNoZWNrIHlvdXIgZW1haWwgZm9yIHRoZSB2ZXJpZmljYXRpb24gbGluay4nXG4gICAgICAgIGNhbkVucm9sbCA9IGZhbHNlXG4gICAgICAgIHJlZGlyZWN0VG8gPSAnL3RoZXJhcGlzdC9sb2dpbidcbiAgICAgIH0gZWxzZSBpZiAodGhlcmFwaXN0RGF0YS5zdGF0dXMgPT09ICdhcHByb3ZlZCcpIHtcbiAgICAgICAgbWVzc2FnZSA9ICdZb3UgYXJlIGFscmVhZHkgZW5yb2xsZWQgYXMgYSB0aGVyYXBpc3QgYW5kIGFwcHJvdmVkISBQbGVhc2UgdXNlIHRoZSBsb2dpbiBwYWdlIHRvIGFjY2VzcyB5b3VyIGRhc2hib2FyZC4nXG4gICAgICAgIGNhbkVucm9sbCA9IGZhbHNlXG4gICAgICAgIHJlZGlyZWN0VG8gPSAnL3RoZXJhcGlzdC9sb2dpbidcbiAgICAgIH0gZWxzZSBpZiAodGhlcmFwaXN0RGF0YS5zdGF0dXMgPT09ICdyZWplY3RlZCcpIHtcbiAgICAgICAgbWVzc2FnZSA9ICdZb3VyIHByZXZpb3VzIHRoZXJhcGlzdCBlbnJvbGxtZW50IHdhcyByZWplY3RlZC4gWW91IGNhbiBzdGlsbCBlbnJvbGwgZm9yIG90aGVyIHJvbGVzIG9yIGNvbnRhY3Qgc3VwcG9ydCBmb3IgYXNzaXN0YW5jZS4nXG4gICAgICAgIGNhbkVucm9sbCA9IHRydWVcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe1xuICAgICAgZXhpc3RzLFxuICAgICAgY2FuRW5yb2xsLFxuICAgICAgbWVzc2FnZSxcbiAgICAgIHJlZGlyZWN0VG8sXG4gICAgICB1c2VyVHlwZTogdXNlckRhdGE/LnVzZXJfdHlwZSxcbiAgICAgIGlzVmVyaWZpZWQ6IHVzZXJEYXRhPy5pc192ZXJpZmllZCxcbiAgICAgIHN0YXR1czogdGhlcmFwaXN0RGF0YT8uc3RhdHVzXG4gICAgfSlcblxuICB9IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGNoZWNraW5nIGVtYWlsOicsIGVycm9yKVxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7IGVycm9yOiAnSW50ZXJuYWwgc2VydmVyIGVycm9yJyB9LCB7IHN0YXR1czogNTAwIH0pXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJjcmVhdGVDbGllbnQiLCJQT1NUIiwicmVxdWVzdCIsImVtYWlsIiwidXNlclR5cGUiLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJzdXBhYmFzZSIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIiwiZGF0YSIsInVzZXJEYXRhIiwidXNlckVycm9yIiwiZnJvbSIsInNlbGVjdCIsImVxIiwidHJpbSIsInNpbmdsZSIsInRoZXJhcGlzdERhdGEiLCJ0aGVyYXBpc3RFcnJvciIsImV4aXN0cyIsIm1lc3NhZ2UiLCJjYW5FbnJvbGwiLCJyZWRpcmVjdFRvIiwidXNlcl90eXBlIiwiaXNfdmVyaWZpZWQiLCJpc1ZlcmlmaWVkIiwiY29uc29sZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/check-email-exists/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fcheck-email-exists%2Froute&page=%2Fapi%2Fcheck-email-exists%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fcheck-email-exists%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fcheck-email-exists%2Froute&page=%2Fapi%2Fcheck-email-exists%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fcheck-email-exists%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_macbook_Desktop_trpi_app_app_api_check_email_exists_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/check-email-exists/route.ts */ \"(rsc)/./app/api/check-email-exists/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/check-email-exists/route\",\n        pathname: \"/api/check-email-exists\",\n        filename: \"route\",\n        bundlePath: \"app/api/check-email-exists/route\"\n    },\n    resolvedPagePath: \"/Users/macbook/Desktop/trpi-app/app/api/check-email-exists/route.ts\",\n    nextConfigOutput,\n    userland: _Users_macbook_Desktop_trpi_app_app_api_check_email_exists_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZjaGVjay1lbWFpbC1leGlzdHMlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRmNoZWNrLWVtYWlsLWV4aXN0cyUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRmNoZWNrLWVtYWlsLWV4aXN0cyUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRm1hY2Jvb2slMkZEZXNrdG9wJTJGdHJwaS1hcHAlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGbWFjYm9vayUyRkRlc2t0b3AlMkZ0cnBpLWFwcCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD1zdGFuZGFsb25lJnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ21CO0FBQ2hHO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvbWFjYm9vay9EZXNrdG9wL3RycGktYXBwL2FwcC9hcGkvY2hlY2stZW1haWwtZXhpc3RzL3JvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcInN0YW5kYWxvbmVcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvY2hlY2stZW1haWwtZXhpc3RzL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvY2hlY2stZW1haWwtZXhpc3RzXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9jaGVjay1lbWFpbC1leGlzdHMvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCIvVXNlcnMvbWFjYm9vay9EZXNrdG9wL3RycGktYXBwL2FwcC9hcGkvY2hlY2stZW1haWwtZXhpc3RzL3JvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fcheck-email-exists%2Froute&page=%2Fapi%2Fcheck-email-exists%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fcheck-email-exists%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "http":
/*!***********************!*\
  !*** external "http" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("http");

/***/ }),

/***/ "https":
/*!************************!*\
  !*** external "https" ***!
  \************************/
/***/ ((module) => {

"use strict";
module.exports = require("https");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "punycode":
/*!***************************!*\
  !*** external "punycode" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("punycode");

/***/ }),

/***/ "stream":
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "zlib":
/*!***********************!*\
  !*** external "zlib" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("zlib");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fcheck-email-exists%2Froute&page=%2Fapi%2Fcheck-email-exists%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fcheck-email-exists%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();