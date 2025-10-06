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
exports.id = "app/api/therapist/clients/route";
exports.ids = ["app/api/therapist/clients/route"];
exports.modules = {

/***/ "(rsc)/./app/api/therapist/clients/route.ts":
/*!********************************************!*\
  !*** ./app/api/therapist/clients/route.ts ***!
  \********************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @supabase/supabase-js */ \"(rsc)/./node_modules/@supabase/supabase-js/dist/module/index.js\");\n\n\nconst supabase = (0,_supabase_supabase_js__WEBPACK_IMPORTED_MODULE_1__.createClient)(\"https://frzciymslvpohhyefmtr.supabase.co\", process.env.SUPABASE_SERVICE_ROLE_KEY);\nasync function GET(request) {\n    try {\n        const { searchParams } = new URL(request.url);\n        const therapistId = searchParams.get('therapistId');\n        const clientId = searchParams.get('clientId');\n        if (!therapistId) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                error: 'Therapist ID is required'\n            }, {\n                status: 400\n            });\n        }\n        // If clientId is provided, fetch specific client details\n        if (clientId) {\n            // Fetch specific client data\n            const { data: client, error: clientError } = await supabase.from('users').select('*').eq('id', clientId).eq('user_type', 'user').single();\n            if (clientError) throw clientError;\n            // Fetch sessions for this specific client with this therapist\n            const { data: sessions, error: sessionsError } = await supabase.from('sessions').select('*').eq('therapist_id', therapistId).eq('user_id', clientId).order('created_at', {\n                ascending: false\n            });\n            if (sessionsError) throw sessionsError;\n            // Fetch patient biodata for this client\n            const { data: biodata, error: biodataError } = await supabase.from('patient_biodata').select('*').eq('user_id', clientId).single();\n            // Fetch medical history for this client\n            const { data: medicalHistory, error: medicalError } = await supabase.from('patient_medical_history').select('*').eq('user_id', clientId).eq('therapist_id', therapistId).order('diagnosis_date', {\n                ascending: false\n            });\n            // Calculate stats\n            const totalSessions = sessions?.length || 0;\n            const completedSessions = sessions?.filter((s)=>s.status === 'completed').length || 0;\n            const upcomingSessions = sessions?.filter((s)=>s.status === 'scheduled').length || 0;\n            const amountEarned = completedSessions * 5000 // ₦5,000 per session\n            ;\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                client: {\n                    id: client.id,\n                    name: client.full_name || 'Unknown Client',\n                    email: client.email,\n                    picture: null,\n                    lastSeen: sessions?.[0]?.created_at ? new Date(sessions[0].created_at).toLocaleDateString() : 'Never',\n                    totalSessions,\n                    completedSessions,\n                    upcomingSessions,\n                    amountEarned,\n                    biodata: biodata || {},\n                    medicalHistory: medicalHistory || []\n                },\n                sessions: sessions || []\n            });\n        }\n        // Fetch all clients for this therapist\n        const { data: sessions, error: sessionsError } = await supabase.from('sessions').select('*').eq('therapist_id', therapistId).not('user_id', 'is', null).order('created_at', {\n            ascending: false\n        });\n        if (sessionsError) throw sessionsError;\n        // Get unique clients\n        const uniqueClientIds = [\n            ...new Set(sessions?.map((s)=>s.user_id).filter(Boolean))\n        ];\n        // Fetch client details for each unique client\n        const clientsData = await Promise.all(uniqueClientIds.map(async (clientId)=>{\n            const { data: client, error: clientError } = await supabase.from('users').select('*').eq('id', clientId).eq('user_type', 'user').single();\n            if (clientError) return null;\n            // Get sessions for this specific client\n            const clientSessions = sessions?.filter((s)=>s.user_id === clientId) || [];\n            const lastSession = clientSessions[0];\n            const lastSeen = lastSession?.created_at ? new Date(lastSession.created_at).toLocaleDateString() : 'Never';\n            return {\n                id: client.id,\n                name: client.full_name || 'Unknown Client',\n                email: client.email,\n                picture: null,\n                lastSeen,\n                sessions: clientSessions.length,\n                lastSessionDate: lastSession?.created_at\n            };\n        }));\n        // Filter out null values and sort by last session date\n        const validClients = clientsData.filter(Boolean).sort((a, b)=>{\n            if (!a?.lastSessionDate && !b?.lastSessionDate) return 0;\n            if (!a?.lastSessionDate) return 1;\n            if (!b?.lastSessionDate) return -1;\n            return new Date(b.lastSessionDate).getTime() - new Date(a.lastSessionDate).getTime();\n        });\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            clients: validClients\n        });\n    } catch (error) {\n        console.error('Error fetching therapist clients:', error);\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            clients: [],\n            error: 'Failed to fetch client data'\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3RoZXJhcGlzdC9jbGllbnRzL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7OztBQUEwQztBQUNVO0FBRXBELE1BQU1FLFdBQVdELG1FQUFZQSxDQUMzQkUsMENBQW9DLEVBQ3BDQSxRQUFRQyxHQUFHLENBQUNFLHlCQUF5QjtBQUdoQyxlQUFlQyxJQUFJQyxPQUFnQjtJQUN4QyxJQUFJO1FBQ0YsTUFBTSxFQUFFQyxZQUFZLEVBQUUsR0FBRyxJQUFJQyxJQUFJRixRQUFRRyxHQUFHO1FBQzVDLE1BQU1DLGNBQWNILGFBQWFJLEdBQUcsQ0FBQztRQUNyQyxNQUFNQyxXQUFXTCxhQUFhSSxHQUFHLENBQUM7UUFFbEMsSUFBSSxDQUFDRCxhQUFhO1lBQ2hCLE9BQU9aLHFEQUFZQSxDQUFDZSxJQUFJLENBQUM7Z0JBQUVDLE9BQU87WUFBMkIsR0FBRztnQkFBRUMsUUFBUTtZQUFJO1FBQ2hGO1FBRUEseURBQXlEO1FBQ3pELElBQUlILFVBQVU7WUFDWiw2QkFBNkI7WUFDN0IsTUFBTSxFQUFFSSxNQUFNQyxNQUFNLEVBQUVILE9BQU9JLFdBQVcsRUFBRSxHQUFHLE1BQU1sQixTQUNoRG1CLElBQUksQ0FBQyxTQUNMQyxNQUFNLENBQUMsS0FDUEMsRUFBRSxDQUFDLE1BQU1ULFVBQ1RTLEVBQUUsQ0FBQyxhQUFhLFFBQ2hCQyxNQUFNO1lBRVQsSUFBSUosYUFBYSxNQUFNQTtZQUV2Qiw4REFBOEQ7WUFDOUQsTUFBTSxFQUFFRixNQUFNTyxRQUFRLEVBQUVULE9BQU9VLGFBQWEsRUFBRSxHQUFHLE1BQU14QixTQUNwRG1CLElBQUksQ0FBQyxZQUNMQyxNQUFNLENBQUMsS0FDUEMsRUFBRSxDQUFDLGdCQUFnQlgsYUFDbkJXLEVBQUUsQ0FBQyxXQUFXVCxVQUNkYSxLQUFLLENBQUMsY0FBYztnQkFBRUMsV0FBVztZQUFNO1lBRTFDLElBQUlGLGVBQWUsTUFBTUE7WUFFekIsd0NBQXdDO1lBQ3hDLE1BQU0sRUFBRVIsTUFBTVcsT0FBTyxFQUFF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QUFNO2dCQUMvQjBCLGlCQUFpQkQsYUFBYWI7WUFDaEM7UUFDRjtRQUdGLHVEQUF1RDtRQUN2RCxNQUFNZSxlQUFlTixZQUNsQm5CLE1BQU0sQ0FBQ2tCLFNBQ1BRLElBQUksQ0FBQyxDQUFDQyxHQUFHQztZQUNSLElBQUksQ0FBQ0QsR0FBR0gsbUJBQW1CLENBQUNJLEdBQUdKLGlCQUFpQixPQUFPO1lBQ3ZELElBQUksQ0FBQ0csR0FBR0gsaUJBQWlCLE9BQU87WUFDaEMsSUFBSSxDQUFDSSxHQUFHSixpQkFBaUIsT0FBTyxDQUFDO1lBQ2pDLE9BQU8sSUFBSWIsS0FBS2lCLEVBQUVKLGVBQWUsRUFBRUssT0FBTyxLQUFLLElBQUlsQixLQUFLZ0IsRUFBRUgsZUFBZSxFQUFFSyxPQUFPO1FBQ3BGO1FBRUYsT0FBT2pFLHFEQUFZQSxDQUFDZSxJQUFJLENBQUM7WUFDdkJtRCxTQUFTTDtRQUNYO0lBRUYsRUFBRSxPQUFPN0MsT0FBTztRQUNkbUQsUUFBUW5ELEtBQUssQ0FBQyxxQ0FBcUNBO1FBQ25ELE9BQU9oQixxREFBWUEsQ0FBQ2UsSUFBSSxDQUFDO1lBQ3ZCbUQsU0FBUyxFQUFFO1lBQ1hsRCxPQUFPO1FBQ1QsR0FBRztZQUFFQyxRQUFRO1FBQUk7SUFDbkI7QUFDRiIsInNvdXJjZXMiOlsiL1VzZXJzL21hY2Jvb2svRGVza3RvcC90cnBpLWFwcC9hcHAvYXBpL3RoZXJhcGlzdC9jbGllbnRzL3JvdXRlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IE5leHRSZXNwb25zZSB9IGZyb20gJ25leHQvc2VydmVyJ1xuaW1wb3J0IHsgY3JlYXRlQ2xpZW50IH0gZnJvbSAnQHN1cGFiYXNlL3N1cGFiYXNlLWpzJ1xuXG5jb25zdCBzdXBhYmFzZSA9IGNyZWF0ZUNsaWVudChcbiAgcHJvY2Vzcy5lbnYuTkVYVF9QVUJMSUNfU1VQQUJBU0VfVVJMISxcbiAgcHJvY2Vzcy5lbnYuU1VQQUJBU0VfU0VSVklDRV9ST0xFX0tFWSFcbilcblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIEdFVChyZXF1ZXN0OiBSZXF1ZXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgeyBzZWFyY2hQYXJhbXMgfSA9IG5ldyBVUkwocmVxdWVzdC51cmwpXG4gICAgY29uc3QgdGhlcmFwaXN0SWQgPSBzZWFyY2hQYXJhbXMuZ2V0KCd0aGVyYXBpc3RJZCcpXG4gICAgY29uc3QgY2xpZW50SWQgPSBzZWFyY2hQYXJhbXMuZ2V0KCdjbGllbnRJZCcpXG5cbiAgICBpZiAoIXRoZXJhcGlzdElkKSB7XG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyBlcnJvcjogJ1RoZXJhcGlzdCBJRCBpcyByZXF1aXJlZCcgfSwgeyBzdGF0dXM6IDQwMCB9KVxuICAgIH1cblxuICAgIC8vIElmIGNsaWVudElkIGlzIHByb3ZpZGVkLCBmZXRjaCBzcGVjaWZpYyBjbGllbnQgZGV0YWlsc1xuICAgIGlmIChjbGllbnRJZCkge1xuICAgICAgLy8gRmV0Y2ggc3BlY2lmaWMgY2xpZW50IGRhdGFcbiAgICAgIGNvbnN0IHsgZGF0YTogY2xpZW50LCBlcnJvcjogY2xpZW50RXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAgIC5mcm9tKCd1c2VycycpXG4gICAgICAgIC5zZWxlY3QoJyonKVxuICAgICAgICAuZXEoJ2lkJywgY2xpZW50SWQpXG4gICAgICAgIC5lcSgndXNlcl90eXBlJywgJ3VzZXInKVxuICAgICAgICAuc2luZ2xlKClcblxuICAgICAgaWYgKGNsaWVudEVycm9yKSB0aHJvdyBjbGllbnRFcnJvclxuXG4gICAgICAvLyBGZXRjaCBzZXNzaW9ucyBmb3IgdGhpcyBzcGVjaWZpYyBjbGllbnQgd2l0aCB0aGlzIHRoZXJhcGlzdFxuICAgICAgY29uc3QgeyBkYXRhOiBzZXNzaW9ucywgZXJyb3I6IHNlc3Npb25zRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAgIC5mcm9tKCdzZXNzaW9ucycpXG4gICAgICAgIC5zZWxlY3QoJyonKVxuICAgICAgICAuZXEoJ3RoZXJhcGlzdF9pZCcsIHRoZXJhcGlzdElkKVxuICAgICAgICAuZXEoJ3VzZXJfaWQnLCBjbGllbnRJZClcbiAgICAgICAgLm9yZGVyKCdjcmVhdGVkX2F0JywgeyBhc2NlbmRpbmc6IGZhbHNlIH0pXG5cbiAgICAgIGlmIChzZXNzaW9uc0Vycm9yKSB0aHJvdyBzZXNzaW9uc0Vycm9yXG5cbiAgICAgIC8vIEZldGNoIHBhdGllbnQgYmlvZGF0YSBmb3IgdGhpcyBjbGllbnRcbiAgICAgIGNvbnN0IHsgZGF0YTogYmlvZGF0YSwgZXJyb3I6IGJpb2RhdGFFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgICAgLmZyb20oJ3BhdGllbnRfYmlvZGF0YScpXG4gICAgICAgIC5zZWxlY3QoJyonKVxuICAgICAgICAuZXEoJ3VzZXJfaWQnLCBjbGllbnRJZClcbiAgICAgICAgLnNpbmdsZSgpXG5cbiAgICAgIC8vIEZldGNoIG1lZGljYWwgaGlzdG9yeSBmb3IgdGhpcyBjbGllbnRcbiAgICAgIGNvbnN0IHsgZGF0YTogbWVkaWNhbEhpc3RvcnksIGVycm9yOiBtZWRpY2FsRXJyb3IgfSA9IGF3YWl0IHN1cGFiYXNlXG4gICAgICAgIC5mcm9tKCdwYXRpZW50X21lZGljYWxfaGlzdG9yeScpXG4gICAgICAgIC5zZWxlY3QoJyonKVxuICAgICAgICAuZXEoJ3VzZXJfaWQnLCBjbGllbnRJZClcbiAgICAgICAgLmVxKCd0aGVyYXBpc3RfaWQnLCB0aGVyYXBpc3RJZClcbiAgICAgICAgLm9yZGVyKCdkaWFnbm9zaXNfZGF0ZScsIHsgYXNjZW5kaW5nOiBmYWxzZSB9KVxuXG4gICAgICAvLyBDYWxjdWxhdGUgc3RhdHNcbiAgICAgIGNvbnN0IHRvdGFsU2Vzc2lvbnMgPSBzZXNzaW9ucz8ubGVuZ3RoIHx8IDBcbiAgICAgIGNvbnN0IGNvbXBsZXRlZFNlc3Npb25zID0gc2Vzc2lvbnM/LmZpbHRlcihzID0+IHMuc3RhdHVzID09PSAnY29tcGxldGVkJykubGVuZ3RoIHx8IDBcbiAgICAgIGNvbnN0IHVwY29taW5nU2Vzc2lvbnMgPSBzZXNzaW9ucz8uZmlsdGVyKHMgPT4gcy5zdGF0dXMgPT09ICdzY2hlZHVsZWQnKS5sZW5ndGggfHwgMFxuICAgICAgY29uc3QgYW1vdW50RWFybmVkID0gY29tcGxldGVkU2Vzc2lvbnMgKiA1MDAwIC8vIOKCpjUsMDAwIHBlciBzZXNzaW9uXG5cbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbih7XG4gICAgICAgIGNsaWVudDoge1xuICAgICAgICAgIGlkOiBjbGllbnQuaWQsXG4gICAgICAgICAgbmFtZTogY2xpZW50LmZ1bGxfbmFtZSB8fCAnVW5rbm93biBDbGllbnQnLFxuICAgICAgICAgIGVtYWlsOiBjbGllbnQuZW1haWwsXG4gICAgICAgICAgcGljdHVyZTogbnVsbCwgLy8gTm8gcHJvZmlsZSBwaWN0dXJlcyBpbiBjdXJyZW50IHNjaGVtYVxuICAgICAgICAgIGxhc3RTZWVuOiBzZXNzaW9ucz8uWzBdPy5jcmVhdGVkX2F0ID8gbmV3IERhdGUoc2Vzc2lvbnNbMF0uY3JlYXRlZF9hdCkudG9Mb2NhbGVEYXRlU3RyaW5nKCkgOiAnTmV2ZXInLFxuICAgICAgICAgIHRvdGFsU2Vzc2lvbnMsXG4gICAgICAgICAgY29tcGxldGVkU2Vzc2lvbnMsXG4gICAgICAgICAgdXBjb21pbmdTZXNzaW9ucyxcbiAgICAgICAgICBhbW91bnRFYXJuZWQsXG4gICAgICAgICAgYmlvZGF0YTogYmlvZGF0YSB8fCB7fSxcbiAgICAgICAgICBtZWRpY2FsSGlzdG9yeTogbWVkaWNhbEhpc3RvcnkgfHwgW11cbiAgICAgICAgfSxcbiAgICAgICAgc2Vzc2lvbnM6IHNlc3Npb25zIHx8IFtdXG4gICAgICB9KVxuICAgIH1cblxuICAgIC8vIEZldGNoIGFsbCBjbGllbnRzIGZvciB0aGlzIHRoZXJhcGlzdFxuICAgIGNvbnN0IHsgZGF0YTogc2Vzc2lvbnMsIGVycm9yOiBzZXNzaW9uc0Vycm9yIH0gPSBhd2FpdCBzdXBhYmFzZVxuICAgICAgLmZyb20oJ3Nlc3Npb25zJylcbiAgICAgIC5zZWxlY3QoJyonKVxuICAgICAgLmVxKCd0aGVyYXBpc3RfaWQnLCB0aGVyYXBpc3RJZClcbiAgICAgIC5ub3QoJ3VzZXJfaWQnLCAnaXMnLCBudWxsKVxuICAgICAgLm9yZGVyKCdjcmVhdGVkX2F0JywgeyBhc2NlbmRpbmc6IGZhbHNlIH0pXG5cbiAgICBpZiAoc2Vzc2lvbnNFcnJvcikgdGhyb3cgc2Vzc2lvbnNFcnJvclxuXG4gICAgLy8gR2V0IHVuaXF1ZSBjbGllbnRzXG4gICAgY29uc3QgdW5pcXVlQ2xpZW50SWRzID0gWy4uLm5ldyBTZXQoc2Vzc2lvbnM/Lm1hcChzID0+IHMudXNlcl9pZCkuZmlsdGVyKEJvb2xlYW4pKV1cblxuICAgIC8vIEZldGNoIGNsaWVudCBkZXRhaWxzIGZvciBlYWNoIHVuaXF1ZSBjbGllbnRcbiAgICBjb25zdCBjbGllbnRzRGF0YSA9IGF3YWl0IFByb21pc2UuYWxsKFxuICAgICAgdW5pcXVlQ2xpZW50SWRzLm1hcChhc3luYyAoY2xpZW50SWQpID0+IHtcbiAgICAgICAgY29uc3QgeyBkYXRhOiBjbGllbnQsIGVycm9yOiBjbGllbnRFcnJvciB9ID0gYXdhaXQgc3VwYWJhc2VcbiAgICAgICAgICAuZnJvbSgndXNlcnMnKVxuICAgICAgICAgIC5zZWxlY3QoJyonKVxuICAgICAgICAgIC5lcSgnaWQnLCBjbGllbnRJZClcbiAgICAgICAgICAuZXEoJ3VzZXJfdHlwZScsICd1c2VyJylcbiAgICAgICAgICAuc2luZ2xlKClcblxuICAgICAgICBpZiAoY2xpZW50RXJyb3IpIHJldHVybiBudWxsXG5cbiAgICAgICAgLy8gR2V0IHNlc3Npb25zIGZvciB0aGlzIHNwZWNpZmljIGNsaWVudFxuICAgICAgICBjb25zdCBjbGllbnRTZXNzaW9ucyA9IHNlc3Npb25zPy5maWx0ZXIocyA9PiBzLnVzZXJfaWQgPT09IGNsaWVudElkKSB8fCBbXVxuICAgICAgICBjb25zdCBsYXN0U2Vzc2lvbiA9IGNsaWVudFNlc3Npb25zWzBdXG4gICAgICAgIGNvbnN0IGxhc3RTZWVuID0gbGFzdFNlc3Npb24/LmNyZWF0ZWRfYXQgPyBuZXcgRGF0ZShsYXN0U2Vzc2lvbi5jcmVhdGVkX2F0KS50b0xvY2FsZURhdGVTdHJpbmcoKSA6ICdOZXZlcidcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIGlkOiBjbGllbnQuaWQsXG4gICAgICAgICAgbmFtZTogY2xpZW50LmZ1bGxfbmFtZSB8fCAnVW5rbm93biBDbGllbnQnLFxuICAgICAgICAgIGVtYWlsOiBjbGllbnQuZW1haWwsXG4gICAgICAgICAgcGljdHVyZTogbnVsbCwgLy8gTm8gcHJvZmlsZSBwaWN0dXJlcyBpbiBjdXJyZW50IHNjaGVtYVxuICAgICAgICAgIGxhc3RTZWVuLFxuICAgICAgICAgIHNlc3Npb25zOiBjbGllbnRTZXNzaW9ucy5sZW5ndGgsXG4gICAgICAgICAgbGFzdFNlc3Npb25EYXRlOiBsYXN0U2Vzc2lvbj8uY3JlYXRlZF9hdFxuICAgICAgICB9XG4gICAgICB9KVxuICAgIClcblxuICAgIC8vIEZpbHRlciBvdXQgbnVsbCB2YWx1ZXMgYW5kIHNvcnQgYnkgbGFzdCBzZXNzaW9uIGRhdGVcbiAgICBjb25zdCB2YWxpZENsaWVudHMgPSBjbGllbnRzRGF0YVxuICAgICAgLmZpbHRlcihCb29sZWFuKVxuICAgICAgLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgaWYgKCFhPy5sYXN0U2Vzc2lvbkRhdGUgJiYgIWI/Lmxhc3RTZXNzaW9uRGF0ZSkgcmV0dXJuIDBcbiAgICAgICAgaWYgKCFhPy5sYXN0U2Vzc2lvbkRhdGUpIHJldHVybiAxXG4gICAgICAgIGlmICghYj8ubGFzdFNlc3Npb25EYXRlKSByZXR1cm4gLTFcbiAgICAgICAgcmV0dXJuIG5ldyBEYXRlKGIubGFzdFNlc3Npb25EYXRlKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZShhLmxhc3RTZXNzaW9uRGF0ZSkuZ2V0VGltZSgpXG4gICAgICB9KVxuXG4gICAgcmV0dXJuIE5leHRSZXNwb25zZS5qc29uKHtcbiAgICAgIGNsaWVudHM6IHZhbGlkQ2xpZW50c1xuICAgIH0pXG5cbiAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICBjb25zb2xlLmVycm9yKCdFcnJvciBmZXRjaGluZyB0aGVyYXBpc3QgY2xpZW50czonLCBlcnJvcilcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oe1xuICAgICAgY2xpZW50czogW10sXG4gICAgICBlcnJvcjogJ0ZhaWxlZCB0byBmZXRjaCBjbGllbnQgZGF0YSdcbiAgICB9LCB7IHN0YXR1czogNTAwIH0pXG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJOZXh0UmVzcG9uc2UiLCJjcmVhdGVDbGllbnQiLCJzdXBhYmFzZSIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TVVBBQkFTRV9VUkwiLCJTVVBBQkFTRV9TRVJWSUNFX1JPTEVfS0VZIiwiR0VUIiwicmVxdWVzdCIsInNlYXJjaFBhcmFtcyIsIlVSTCIsInVybCIsInRoZXJhcGlzdElkIiwiZ2V0IiwiY2xpZW50SWQiLCJqc29uIiwiZXJyb3IiLCJzdGF0dXMiLCJkYXRhIiwiY2xpZW50IiwiY2xpZW50RXJyb3IiLCJmcm9tIiwic2VsZWN0IiwiZXEiLCJzaW5nbGUiLCJzZXNzaW9ucyIsInNlc3Npb25zRXJyb3IiLCJvcmRlciIsImFzY2VuZGluZyIsImJpb2RhdGEiLCJiaW9kYXRhRXJyb3IiLCJtZWRpY2FsSGlzdG9yeSIsIm1lZGljYWxFcnJvciIsInRvdGFsU2Vzc2lvbnMiLCJsZW5ndGgiLCJjb21wbGV0ZWRTZXNzaW9ucyIsImZpbHRlciIsInMiLCJ1cGNvbWluZ1Nlc3Npb25zIiwiYW1vdW50RWFybmVkIiwiaWQiLCJuYW1lIiwiZnVsbF9uYW1lIiwiZW1haWwiLCJwaWN0dXJlIiwibGFzdFNlZW4iLCJjcmVhdGVkX2F0IiwiRGF0ZSIsInRvTG9jYWxlRGF0ZVN0cmluZyIsIm5vdCIsInVuaXF1ZUNsaWVudElkcyIsIlNldCIsIm1hcCIsInVzZXJfaWQiLCJCb29sZWFuIiwiY2xpZW50c0RhdGEiLCJQcm9taXNlIiwiYWxsIiwiY2xpZW50U2Vzc2lvbnMiLCJsYXN0U2Vzc2lvbiIsImxhc3RTZXNzaW9uRGF0ZSIsInZhbGlkQ2xpZW50cyIsInNvcnQiLCJhIiwiYiIsImdldFRpbWUiLCJjbGllbnRzIiwiY29uc29sZSJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/therapist/clients/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftherapist%2Fclients%2Froute&page=%2Fapi%2Ftherapist%2Fclients%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftherapist%2Fclients%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!":
/*!***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftherapist%2Fclients%2Froute&page=%2Fapi%2Ftherapist%2Fclients%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftherapist%2Fclients%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D! ***!
  \***********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var _Users_macbook_Desktop_trpi_app_app_api_therapist_clients_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/therapist/clients/route.ts */ \"(rsc)/./app/api/therapist/clients/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"standalone\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/therapist/clients/route\",\n        pathname: \"/api/therapist/clients\",\n        filename: \"route\",\n        bundlePath: \"app/api/therapist/clients/route\"\n    },\n    resolvedPagePath: \"/Users/macbook/Desktop/trpi-app/app/api/therapist/clients/route.ts\",\n    nextConfigOutput,\n    userland: _Users_macbook_Desktop_trpi_app_app_api_therapist_clients_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZ0aGVyYXBpc3QlMkZjbGllbnRzJTJGcm91dGUmcGFnZT0lMkZhcGklMkZ0aGVyYXBpc3QlMkZjbGllbnRzJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGdGhlcmFwaXN0JTJGY2xpZW50cyUyRnJvdXRlLnRzJmFwcERpcj0lMkZVc2VycyUyRm1hY2Jvb2slMkZEZXNrdG9wJTJGdHJwaS1hcHAlMkZhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPSUyRlVzZXJzJTJGbWFjYm9vayUyRkRlc2t0b3AlMkZ0cnBpLWFwcCZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD1zdGFuZGFsb25lJnByZWZlcnJlZFJlZ2lvbj0mbWlkZGxld2FyZUNvbmZpZz1lMzAlM0QhIiwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7O0FBQStGO0FBQ3ZDO0FBQ3FCO0FBQ2tCO0FBQy9GO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCIvVXNlcnMvbWFjYm9vay9EZXNrdG9wL3RycGktYXBwL2FwcC9hcGkvdGhlcmFwaXN0L2NsaWVudHMvcm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwic3RhbmRhbG9uZVwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS90aGVyYXBpc3QvY2xpZW50cy9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3RoZXJhcGlzdC9jbGllbnRzXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS90aGVyYXBpc3QvY2xpZW50cy9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIi9Vc2Vycy9tYWNib29rL0Rlc2t0b3AvdHJwaS1hcHAvYXBwL2FwaS90aGVyYXBpc3QvY2xpZW50cy9yb3V0ZS50c1wiLFxuICAgIG5leHRDb25maWdPdXRwdXQsXG4gICAgdXNlcmxhbmRcbn0pO1xuLy8gUHVsbCBvdXQgdGhlIGV4cG9ydHMgdGhhdCB3ZSBuZWVkIHRvIGV4cG9zZSBmcm9tIHRoZSBtb2R1bGUuIFRoaXMgc2hvdWxkXG4vLyBiZSBlbGltaW5hdGVkIHdoZW4gd2UndmUgbW92ZWQgdGhlIG90aGVyIHJvdXRlcyB0byB0aGUgbmV3IGZvcm1hdC4gVGhlc2Vcbi8vIGFyZSB1c2VkIHRvIGhvb2sgaW50byB0aGUgcm91dGUuXG5jb25zdCB7IHdvcmtBc3luY1N0b3JhZ2UsIHdvcmtVbml0QXN5bmNTdG9yYWdlLCBzZXJ2ZXJIb29rcyB9ID0gcm91dGVNb2R1bGU7XG5mdW5jdGlvbiBwYXRjaEZldGNoKCkge1xuICAgIHJldHVybiBfcGF0Y2hGZXRjaCh7XG4gICAgICAgIHdvcmtBc3luY1N0b3JhZ2UsXG4gICAgICAgIHdvcmtVbml0QXN5bmNTdG9yYWdlXG4gICAgfSk7XG59XG5leHBvcnQgeyByb3V0ZU1vZHVsZSwgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzLCBwYXRjaEZldGNoLCAgfTtcblxuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXBwLXJvdXRlLmpzLm1hcCJdLCJuYW1lcyI6W10sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftherapist%2Fclients%2Froute&page=%2Fapi%2Ftherapist%2Fclients%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftherapist%2Fclients%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!\n");

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
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@supabase","vendor-chunks/tr46","vendor-chunks/whatwg-url","vendor-chunks/webidl-conversions"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Ftherapist%2Fclients%2Froute&page=%2Fapi%2Ftherapist%2Fclients%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Ftherapist%2Fclients%2Froute.ts&appDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app%2Fapp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=%2FUsers%2Fmacbook%2FDesktop%2Ftrpi-app&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=standalone&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();