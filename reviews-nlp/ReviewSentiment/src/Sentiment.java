import edu.stanford.nlp.ling.CoreAnnotations;
import edu.stanford.nlp.neural.rnn.RNNCoreAnnotations;
import edu.stanford.nlp.pipeline.Annotation;
import edu.stanford.nlp.pipeline.StanfordCoreNLP;
import edu.stanford.nlp.sentiment.SentimentCoreAnnotations;
import edu.stanford.nlp.trees.Tree;
import edu.stanford.nlp.util.CoreMap;

import java.io.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;
import java.util.Scanner;
import java.util.stream.Collectors;

public class Sentiment {
    private static class Pair {
        String string;
        int sentiment = -1;
        double probability = -1;
        int tokens = 0;
        public String toString() {
            return "[" + string.trim() + "] " + (sentiment - 2);
        }
    }

    public static List<Pair> handleTree(Tree tree) {
        List<Pair> pairs = new ArrayList<>();
        handleSubtree(tree, pairs);
        return pairs;
    }

    private static Pair handleSubtree(Tree tree, List<Pair> accumulated) {
        int pred_class = RNNCoreAnnotations.getPredictedClass(tree.label());
        Pair p = new Pair();
        if (pred_class == -1) {
            p.string = tree.label().toString();
            p.tokens = 1;
            return p;
        } else {
            String accum = "";
            int i = 0;
            for (Tree child : tree.children()) {
                Pair r = handleSubtree(child, accumulated);
                accum += " " + r.string.trim();
                i += r.tokens;
            }
            p.string = accum;
            p.tokens += i;
            p.sentiment = pred_class;
            p.probability = RNNCoreAnnotations.getPredictedClassProb(tree.label());
            accumulated.add(p);
            return p;
        }
    }

    private static String doubleBuffer(BufferedReader reader) throws IOException {
        StringBuilder b = new StringBuilder();
        String line = reader.readLine();
        if (line == null) {
            return null;
        }
        while (line != null) {
            b.append(line);
            line = reader.readLine();
        }
        return b.toString();
    }

    public static void main(String[] args) throws IOException {
        Properties props = new Properties();
        props.setProperty("annotators", "tokenize, ssplit, pos, parse, sentiment");
        props.setProperty("parse.model", "edu/stanford/nlp/models/srparser/englishSR.ser.gz");
        StanfordCoreNLP pipeline = new StanfordCoreNLP(props);

        BufferedReader reader = new BufferedReader(new FileReader(args[0]));

        BufferedWriter writer = new BufferedWriter(new FileWriter(args[1]));

        long start = System.currentTimeMillis();
        System.out.println("Starting core loop");
        long i = 0;
        while (true) {
            if (i % 100 == 0) {
                System.out.println(i);
            }
            i += 1;
            String line = reader.readLine();
            if (line == null) {
                break;
            }
            Annotation document = new Annotation(line);
            pipeline.annotate(document);

            List<CoreMap> sentences = document.get(CoreAnnotations.SentencesAnnotation.class);

            for(CoreMap sentence: sentences) {

                Tree tree = sentence.get(SentimentCoreAnnotations.SentimentAnnotatedTree.class);
                List<Pair> pairs = handleTree(tree);
                //filter phrases that are only a single token
                pairs = pairs.stream()
                            .filter(pair -> pair.tokens > 1)
                            .filter(pair -> pair.probability > 0.5)
                            .filter(pair -> pair.sentiment != 2)
                        .collect(Collectors.toList());
                for (Pair p : pairs) {
                    writer.write(String.format("%d|%d|%3.3f|%s\n", p.tokens, p.sentiment - 2, p.probability, p.string.trim()));
                }
                writer.write("=<sentence>=\n");
            }
            writer.write("===<doc>===\n");
        }
        writer.flush();
        writer.close();
        System.out.println(System.currentTimeMillis() - start);
    }
}
