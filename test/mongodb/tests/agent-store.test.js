module.exports = api => {
  describe('Agent store', () => {
    it('- is exposed by the connector', () => {
      expect(api.agentStore).toBeTruthy();
      expect(typeof api.agentStore.createRequest).toBe('function');
    });

    it('- creates, lists, reads and updates a request', async () => {
      const created = await api.agentStore.createRequest({
        model: 'cars',
        action_code: 'block_car',
        action_label: 'Block the car',
        item_ids: ['5cd5308e695db945d3cc81b1'],
        data: { reason: 'test' },
        agent: { key_id: 'abcdef0123456789', name: 'Test bot' }
      });
      expect(created.status).toBe('pending');
      expect(created.item_ids).toEqual(['5cd5308e695db945d3cc81b1']);

      const pending = await api.agentStore.listRequests({ status: 'pending' });
      expect(pending.map(r => String(r._id))).toContain(String(created._id));

      const filtered = await api.agentStore.listRequests({ status: 'pending', models: ['users'] });
      expect(filtered.map(r => String(r._id))).not.toContain(String(created._id));

      const fetched = await api.agentStore.getRequest(String(created._id));
      expect(fetched.action_code).toBe('block_car');

      const updated = await api.agentStore.updateRequest(String(created._id), {
        status: 'executed',
        decided_by: { user_id: 'u1', name: 'Marc' },
        decided_at: new Date(),
        result: { reload: true },
        model: 'HACK' // not allowed -> ignored
      });
      expect(updated.status).toBe('executed');
      expect(updated.model).toBe('cars');
      expect(updated.decided_by.name).toBe('Marc');
    });

    it('- returns null for an invalid id', async () => {
      expect(await api.agentStore.getRequest('nope')).toBeNull();
      expect(await api.agentStore.updateRequest('nope', { status: 'rejected' })).toBeNull();
    });

    it('- logs and lists agent calls', async () => {
      await api.agentStore.log({
        agent: { key_id: 'abcdef0123456789', name: 'Test bot' },
        tool: 'query_records',
        model: 'cars',
        params: JSON.stringify({ model: 'cars' }),
        success: true,
        duration_ms: 12
      });
      const logs = await api.agentStore.listLogs({ key_id: 'abcdef0123456789' });
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].tool).toBe('query_records');
    });
  });
};
