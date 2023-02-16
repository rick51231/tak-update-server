import {HttpServer} from "./HttpServer";
import {PackageManager} from "./PackageManager";
import {DBHelper} from "./DB/DBHelper";


void (async () => {
    await DBHelper.init();
    await PackageManager.Instance.start();
    HttpServer.Instance.start();

    // let buf = await fs.readFile('stuff/KEY-ALIA.RSA');
    // const asn = NodeForge.asn1.fromDer(buf.toString("binary"));
    // const certificates = (NodeForge.pkcs7 as any).messageFromAsn1(asn)
    //     .certificates as ForgeCertificate[];

    // let buf = await fs.readFile('stuff/KEY-ALIA.EC');
    // const asn = NodeForge.asn1.fromDer(buf.toString("binary"));
    // const certificates = (NodeForge.pkcs7 as any).messageFromAsn1(asn)
    //     .certificates as ForgeCertificate[];
    //
    // console.log(certificates);
})();