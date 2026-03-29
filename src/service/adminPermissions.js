const modules = {
	master: ['master'],
	masterAdmin: ['master', 'admin'],
	masterAdminAgente: ['master', 'admin', 'agente'],
};

const sidebarItems = [
	{ key: 'dashboard', label: 'Dashboard', href: '/admin', roles: modules.masterAdminAgente },
	{ key: 'usuarios', label: 'Usuarios e Perfis', href: '/admin/usuarios', roles: modules.masterAdmin },
	{ key: 'servicos-categorias', label: 'Serviços e Categorias', href: '/admin/servicos', roles: modules.masterAdmin },
	{ key: 'profissionais-config', label: 'Profissionais + Config', href: '/admin/profissionais', roles: modules.masterAdmin },
	{ key: 'empresas', label: 'Empresas', href: '/admin/empresas', roles: modules.master },
	{ key: 'clientes', label: 'Clientes', href: '/admin/clientes', roles: modules.masterAdminAgente },
	{ key: 'agendamentos', label: 'Gerenciar Agendamentos', href: '/admin/agendamentos', roles: modules.masterAdminAgente },
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
