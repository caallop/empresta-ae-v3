"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../src/lib/database");
const mockData_1 = require("../src/services/mockData");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
async function migrateData() {
    try {
        console.log('🚀 Iniciando migração de dados...');
        // 1. Migrar categorias
        console.log('📂 Migrando categorias...');
        for (const category of mockData_1.mockCategories) {
            await database_1.pool.execute('INSERT IGNORE INTO categories (name, icon, color) VALUES (?, ?, ?)', [
                category.name,
                category.icon,
                category.color,
            ]);
        }
        console.log('✅ Categorias migradas');
        // 2. Migrar usuários
        console.log('👥 Migrando usuários...');
        const userIds = [];
        for (const mockUser of mockData_1.mockUsers) {
            const passwordHash = await bcryptjs_1.default.hash('123456', 12); // Senha padrão
            const [result] = await database_1.pool.execute('INSERT IGNORE INTO users (name, email, password_hash, avatar_url, verified) VALUES (?, ?, ?, ?, ?)', [mockUser.name, mockUser.email, passwordHash, mockUser.avatar, mockUser.verified]);
            const userId = result.insertId;
            if (userId)
                userIds.push(userId);
        }
        console.log('✅ Usuários migrados');
        // 3. Migrar itens
        console.log('📦 Migrando itens...');
        for (const mockItem of mockData_1.mockItems) {
            // Buscar categoria
            const [categoryRows] = await database_1.pool.execute('SELECT id FROM categories WHERE name = ?', [
                mockItem.category,
            ]);
            const categories = categoryRows;
            const categoryId = categories[0]?.id || 1;
            // Escolher usuário aleatório
            const randomUserId = userIds[Math.floor(Math.random() * userIds.length)];
            // Inserir item
            const [itemResult] = await database_1.pool.execute(`INSERT INTO items (user_id, category_id, title, description, price, period, status, location_lat, location_lng, address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, [
                randomUserId,
                categoryId,
                mockItem.title,
                mockItem.description,
                mockItem.price,
                mockItem.period,
                mockItem.status,
                mockItem.location?.lat,
                mockItem.location?.lng,
                mockItem.location?.address,
            ]);
            const itemId = itemResult.insertId;
            // Inserir imagens
            if (mockItem.images && mockItem.images.length > 0) {
                for (let i = 0; i < mockItem.images.length; i++) {
                    await database_1.pool.execute('INSERT INTO item_images (item_id, url, is_primary) VALUES (?, ?, ?)', [itemId, mockItem.images[i], i === 0]);
                }
            }
        }
        console.log('✅ Itens migrados');
        console.log('🎉 Migração concluída com sucesso!');
        console.log(`📊 Resumo:`);
        console.log(`   - ${mockData_1.mockCategories.length} categorias`);
        console.log(`   - ${mockData_1.mockUsers.length} usuários`);
        console.log(`   - ${mockData_1.mockItems.length} itens`);
    }
    catch (error) {
        console.error('❌ Erro na migração:', error);
    }
    finally {
        await database_1.pool.end();
    }
}
migrateData();
