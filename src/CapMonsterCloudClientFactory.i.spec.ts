import { createServerMock } from '../tests/helpers';
import { CapMonsterCloudClientFactory } from './CapMonsterCloudClientFactory';
import { ClientOptions } from './ClientOptions';
import { RecaptchaV2ProxylessRequest } from './Requests/RecaptchaV2ProxylessRequest';

describe('Check integration tests for CapMonsterCloudClientFactory()', () => {
  it('should call getBalance method with specified object', async () => {
    expect.assertions(3);

    const srv = await createServerMock({ responses: [{ responseBody: '{"errorId":0,"balance":345.678}' }] });

    const cmcClient = CapMonsterCloudClientFactory.Create(
      new ClientOptions({ clientKey: '<your capmonster.cloud API key>', serviceUrl: `http://localhost:${srv.address.port}` }),
    );

    await cmcClient.getBalance();

    expect(srv.caughtRequests[0]).toHaveProperty('userAgent', CapMonsterCloudClientFactory.CreateUserAgentString());
    expect(srv.caughtRequests[0]).toHaveProperty('body', '{"clientKey":"<your capmonster.cloud API key>"}');

    expect(await srv.destroy()).toBeUndefined();
  });

  it('should call createTask and getTaskResult methods with specified objects', async () => {
    expect.assertions(6);

    const srv = await createServerMock({
      responses: [
        { responseBody: '{"errorId":0,"taskId":7654321}' },
        { responseBody: '{"errorId":0,"status":"ready","solution":{"gRecaptchaResponse":"answer"}}' },
      ],
    });

    const cmcClient = CapMonsterCloudClientFactory.Create(
      new ClientOptions({ clientKey: '<your capmonster.cloud API key>', serviceUrl: `http://localhost:${srv.address.port}` }),
    );

    const recaptchaV2ProxylessRequest = new RecaptchaV2ProxylessRequest({
      websiteURL: 'https://lessons.zennolab.com/captchas/recaptcha/v2_simple.php?level=high',
      websiteKey: '6Lcg7CMUAAAAANphynKgn9YAgA4tQ2KI_iqRyTwd',
    });

    const task = await cmcClient.Solve(recaptchaV2ProxylessRequest);

    expect(srv.caughtRequests[0]).toHaveProperty('userAgent', CapMonsterCloudClientFactory.CreateUserAgentString());
    expect(srv.caughtRequests[0]).toHaveProperty(
      'body',
      '{"clientKey":"<your capmonster.cloud API key>","task":{"type":"NoCaptchaTaskProxyless","websiteURL":"https://lessons.zennolab.com/captchas/recaptcha/v2_simple.php?level=high","websiteKey":"6Lcg7CMUAAAAANphynKgn9YAgA4tQ2KI_iqRyTwd"},"softId":53}',
    );
    expect(srv.caughtRequests[1]).toHaveProperty('body', '{"clientKey":"<your capmonster.cloud API key>","taskId":7654321}');
    expect(task).toHaveProperty('solution');
    expect(task).toHaveProperty('solution.gRecaptchaResponse', 'answer');

    expect(await srv.destroy()).toBeUndefined();
  });
});
