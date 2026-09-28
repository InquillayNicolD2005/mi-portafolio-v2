(() => {
	const form = document.querySelector('.footer-contact');

	if (!form) return;

	const submitButton = form.querySelector('button[type="submit"]');
	const status = form.querySelector('.form-status');
	const defaultButtonLabel = submitButton.textContent;

	form.addEventListener('submit', async (event) => {
		event.preventDefault();

		if (!form.reportValidity()) return;

		submitButton.disabled = true;
		submitButton.textContent = 'Enviando…';
		status.dataset.state = 'sending';
		status.textContent = 'Enviando tu mensaje…';

		try {
			const values = Object.fromEntries(new FormData(form).entries());
			const response = await fetch('/api/submit/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(values)
			});
			const result = await response.json();

			if (!response.ok || !result.ok) {
				throw new Error('No se pudo completar el envío.');
			}

			form.reset();
			status.dataset.state = 'success';
			status.textContent = 'Tu mensaje quedó registrado correctamente.';
		} catch (error) {
			status.dataset.state = 'error';
			status.textContent = 'No se pudo enviar el mensaje. Inténtalo de nuevo.';
		} finally {
			submitButton.disabled = false;
			submitButton.textContent = defaultButtonLabel;
		}
	});
})();
