// Crear una página de prueba para verificar que funciona el sistema
const content = `
<!DOCTYPE html>
<html>
<head>
    <title>Test Battle Challenges</title>
</head>
<body>
    <h2>🔍 Battle Challenge Debug</h2>
    <div id="results"></div>
    
    <script>
        async function testChallenges() {
            try {
                console.log('🔧 Testing challenge loading...')
                
                const token = localStorage.getItem('token')
                if (!token) {
                    document.getElementById('results').innerHTML = 'No token found'
                    return
                }
                
                const response = await fetch('http://localhost:4000/api/battles/challenges', {
                    headers: {
                        'Authorization': 'Bearer ' + token
                    }
                })
                
                const data = await response.json()
                console.log('📋 Challenges:', data)
                
                const results = document.getElementById('results')
                results.innerHTML = \`
                    <h3>Total challenges: \${data.challenges.length}</h3>
                    <pre>\${JSON.stringify(data, null, 2)}</pre>
                \`
                
            } catch (error) {
                console.error('Error:', error)
                document.getElementById('results').innerHTML = 'Error: ' + error.message
            }
        }
        
        testChallenges()
    </script>
</body>
</html>
`

const fs = require('fs')
fs.writeFileSync('c:\\Users\\ksgom\\PWD\\test-challenges.html', content)
console.log('✅ Created test file at c:\\Users\\ksgom\\PWD\\test-challenges.html')
console.log('📖 Open this file in your browser while logged in to debug challenges')