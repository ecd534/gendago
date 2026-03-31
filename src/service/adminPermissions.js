const modules = {
	master: ['master'],
	masterAdmin: ['master', 'admin'],
	masterAdminAgente: ['master', 'admin', 'agente'],
};

const sidebarItems = [
	{ key: 'agendamentos', label: 'Gestão de Agendamentos', href: '/admin/agendamentos', roles: modules.masterAdminAgente },
	{ key: 'usuarios', label: 'Usuarios e Perfis', href: '/admin/usuarios', roles: modules.masterAdmin },
	{ key: 'servicos-categorias', label: 'Serviços e Categorias', href: '/admin/servicos', roles: modules.masterAdmin },
	{ key: 'profissionais-config', label: 'Gestão de Profissionais', href: '/admin/profissionais', roles: modules.masterAdmin },
	{ key: 'empresas', label: 'Empresas', href: '/admin/empresas', roles: modules.master },
	{ key: 'clientes', label: 'Clientes', href: '/admin/clientes', roles: modules.masterAdminAgente },
];

function getSidebarMenuByRole(role) {
	const currentRole = String(role || '').trim();
	if (!currentRole) {
		return [];
	}

	return sidebarItems.filter((item) => item.roles.includes(currentRole));
}

module.exports = {
	modules,
	sidebarItems,
	getSidebarMenuByRole,
};
