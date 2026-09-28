(() => {
	const params = new URLSearchParams(window.location.search);
	const requestedProject = params.get('project') || 'generic';
	const titles = {
		inventario: 'Sistema de inventario',
		calculadora: 'Clon de calculadora',
		clima: 'Dashboard de clima',
		contrasenas: 'Generador de contraseñas'
	};
	const project = Object.prototype.hasOwnProperty.call(titles, requestedProject) ? requestedProject : 'generic';
	const title = titles[project] || 'Proyecto';
	const form = document.getElementById('project-form');
	const submitButton = document.getElementById('send-btn');
	const status = document.getElementById('project-status');
	const projectInput = document.getElementById('project-input');
	const defaultButtonLabel = submitButton.textContent;

	document.getElementById('project-title').textContent = title;
	document.getElementById('project-description').textContent = `¿Qué te pareció ${title}? Deja tus preguntas o sugerencias a continuación.`;
	projectInput.value = project;

	if (project !== 'generic' && window.ProjectDemos) {
		window.ProjectDemos.mount(project);
	}

	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		if (submitButton.disabled || !form.reportValidity()) return;

		const data = Object.fromEntries(new FormData(form).entries());
		submitButton.disabled = true;
		submitButton.textContent = 'Enviando…';
		status.dataset.state = 'sending';
		status.textContent = 'Enviando tu comentario…';

		try {
			const response = await fetch('/api/submit/' + encodeURIComponent(project), {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(data)
			});

			if (!response.ok) throw new Error('No se pudo completar el envío.');

			form.reset();
			projectInput.value = project;
			status.dataset.state = 'success';
			status.textContent = 'Tu comentario quedó registrado correctamente.';
		} catch (error) {
			try {
				const key = project + '_submissions';
				const saved = JSON.parse(localStorage.getItem(key) || '[]');
				saved.push({ ts: Date.now(), data: data });
				localStorage.setItem(key, JSON.stringify(saved));
				form.reset();
				projectInput.value = project;
				status.dataset.state = 'success';
				status.textContent = 'No hay conexión con el servidor. Tu comentario quedó guardado en este dispositivo.';
			} catch (storageError) {
				status.dataset.state = 'error';
				status.textContent = 'No se pudo guardar el comentario. Inténtalo de nuevo.';
			}
		} finally {
			submitButton.disabled = false;
			submitButton.textContent = defaultButtonLabel;
		}
	});
})();
