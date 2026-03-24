import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

function goToMaintenancePage(reason) {
	const currentPath = window.location.pathname
	if (currentPath.endsWith('/error.html')) return

	// Small trace in console for easier debugging before redirect.
	console.error('[global-error]', reason)
	window.location.href = '/error.html'
}


window.addEventListener('error', (event) => {
	goToMaintenancePage(event.error || event.message || 'Unknown runtime error')
})

window.addEventListener('unhandledrejection', (event) => {
	goToMaintenancePage(event.reason || 'Unhandled promise rejection')
})

const app = createApp(App)

app.config.errorHandler = (err) => {
	goToMaintenancePage(err)
}

app.mount('#app')
